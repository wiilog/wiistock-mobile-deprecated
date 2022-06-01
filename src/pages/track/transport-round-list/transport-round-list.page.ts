import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRound} from "@entities/transport-round";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {ApiService} from "@app/common/services/api.service";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import * as moment from "moment";
import {ToastService} from "@app/common/services/toast.service";
import {NetworkService} from "@app/common/services/network.service";
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {TransportRoundLine} from "@entities/transport-round-line";
import {AlertService} from "@app/common/services/alert.service";

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage extends PageComponent implements ViewWillEnter {

    public transportRoundsByDates: {
        [date: string]: Array<TransportRound>
    };

    public loading: boolean;

    public constructor(navService: NavService,
                       private apiService: ApiService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private alertService: AlertService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        moment.locale('fr');
        this.synchronise();
    }

    public formatDate(date): string {
        return moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY');
    }

    public view(event, round: TransportRound) {
        this.navService.push(NavPathEnum.TRANSPORT_LIST, {
            round,
            mode: round.status !== 'En cours' ? TransportCardMode.VIEW : TransportCardMode.STARTABLE,
        });
    }

    public load(event: any, round: TransportRound): void {
        event.stopPropagation();

        if(round.loaded_packs === round.total_loaded) {
            return;
        }

        this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
            round
        });
    }

    public start(event: any, round: TransportRound) {
        event.stopPropagation();

        if(round.loaded_packs !== round.total_loaded) {
            return;
        }

        if (round.ready_deliveries != round.total_ready_deliveries) {
            this.alertService.show({
                header: `Attention`,
                cssClass: `warning`,
                message: `Des livraisons ne sont pas encore préparées. Elles seront exclues de cette tournée si vous confirmez son début.`,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel'
                    },
                    {
                        text: 'Confirmer',
                        handler: () => {
                            this.proceedWithStart(event, round);
                        },
                        cssClass: 'alert-success'
                    }
                ],
            });
        } else {
            this.proceedWithStart(event, round);
        }
    }

    public depositPacks(event: any, round: TransportRound) {

    }

    public finishRound(event: any, round: TransportRound) {

    }

    proceedWithStart(event: any, round: TransportRound) {
        if (this.networkService.hasNetwork()) {
            const packs = round.lines
                .reduce(
                    (acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc],
                    []
                ).map(({code}) => code);
            const options = {
                params: {
                    round: round.id,
                    packs: packs
                }
            }
            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.HAS_NEW_PACKS, options)
            }).subscribe(({success, has_new_packs}) => {
                if (success) {
                    if (has_new_packs) {
                        this.alertService.show({
                            header: 'Attention',
                            cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                            message: 'De nouveaux colis ont été ajoutés, veuillez les charger avant de débuter la tournée',
                            buttons: [{
                                text: 'Charger',
                                cssClass: 'alert-success',
                                handler: () => this.synchronise()
                            }]
                        });
                    } else {
                        const options = {
                            params: {
                                round: round.id
                            }
                        }
                        this.loadingService.presentLoadingWhile({
                            event: () => this.apiService.requestApi(ApiService.START_DELIVERY_ROUND, options)
                        }).subscribe(() => {
                            this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                round,
                                mode: TransportCardMode.STARTABLE,
                            });

                            event.stopPropagation();
                        });
                    }
                }
            });
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de débuter la tournée');
        }
    }

    public synchronise(): void {
        if (this.networkService.hasNetwork()) {
            this.loading = true;
            zip(
                this.loadingService.presentLoading('Récupération des tournées en cours'),
                this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS)
            ).subscribe(([loading, rounds]: [HTMLIonLoadingElement, Array<TransportRound>]) => {
                loading.dismiss();

                for(const round of rounds) {
                    for(const transport of round.lines) {
                        transport.round = round;
                        if(transport.collect) {
                            transport.collect.round = round;
                        }
                    }
                }

                this.transportRoundsByDates = rounds
                    .sort(({date: date1}, {date: date2}) => {
                        const momentDate1 = moment(date1, 'DD/MM/YYYY')
                        const momentDate2 = moment(date2, 'DD/MM/YYYY')
                        return (
                            momentDate1.isBefore(momentDate2) ? -1 :
                                momentDate1.isAfter(momentDate2) ? 1 :
                                    0
                        );
                    })
                    .reduce((acc, round) => {
                        (acc[round['date']] = acc[round['date']] || []).push(round);
                        return acc;
                    }, {});
                this.loading = false;
            });
        } else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

}
