import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRound} from '@entities/transport-round';
import {LoadingService} from '@app/common/services/loading.service';
import {ApiService} from '@app/common/services/api.service';
import {zip} from 'rxjs';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import * as moment from 'moment';
import {ToastService} from '@app/common/services/toast.service';
import {NetworkService} from '@app/common/services/network.service';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {TransportPack, TransportRoundLine} from '@entities/transport-round-line';
import {AlertService} from '@app/common/services/alert.service';
import {MainHeaderService} from '@app/common/services/main-header.service';

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
                       private mainHeaderService: MainHeaderService,
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

        if (round.loaded_packs === round.total_loaded) {
            return;
        }

        this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
            round
        });
    }

    public start(event: any, round: TransportRound) {
        event.stopPropagation();

        if (round.loaded_packs !== round.total_loaded) {
            return;
        }

        this.proceedWithStart(event, round);
    }

    public depositPacks(event: any, round: TransportRound) {
        event.stopPropagation();
        const depositedDeliveries = round.deposited_delivery_packs || round.packs_to_return === round.returned_packs;
        const depositedCollects = round.deposited_collect_packs || round.packs_to_deposit === round.deposited_packs;

        if (!depositedDeliveries || !depositedCollects) {
            if (depositedDeliveries) {
                this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
                    round,
                    skippedMenu: true,
                });
            } else if (depositedCollects) {
                this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_PACKS, {
                    round,
                    skippedMenu: true,
                });
            } else {
                this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_MENU, {
                    round,
                    skippedMenu: false,
                });
            }
        }
    }

    public finishRound(event: any, round: TransportRound): void {
        event.stopPropagation();
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_END_ROUND_LOCATIONS)
        }).subscribe(({endRoundLocations}) => {
            if(endRoundLocations.length > 0) {
                const packsToDrop = round.lines
                    .filter(({failure}) => failure)
                    .reduce(
                        (acc: Array<any>, line: TransportRoundLine) => [...(line.packs
                            .filter(({temperature_range, dropped}) => temperature_range && !dropped) || []), ...acc],
                        []
                    );

                if(packsToDrop.length === 0) {
                    this.navService.push(NavPathEnum.TRANSPORT_ROUND_FINISH, {
                        round,
                        endRoundLocations
                    });
                } else {
                    this.loadingService.presentLoadingWhile({
                        event: () => this.apiService.requestApi(ApiService.UNDELIVERED_PACKS_LOCATIONS)
                    }).subscribe(({undeliveredPacksLocations}) => {
                        if(undeliveredPacksLocations.length > 0) {
                            console.log(undeliveredPacksLocations);
                            this.navService.push(NavPathEnum.TRANSPORT_ROUND_FINISH_PACK_DROP, {
                                round,
                                packs: packsToDrop,
                                endRoundLocations,
                                undeliveredPacksLocations,
                                hasPacksToDrop: true
                            });
                        } else {
                            this.toastService.presentToast(`Aucun emplacement de retour des colis non livrés n'a été paramétré, vous ne pouvez pas continuer.`)
                        }
                    });

                }
            } else {
                this.toastService.presentToast(`Aucun emplacement de fin de tournée n'a été paramétré, vous ne pouvez pas continuer.`)
            }
        });

    }

    proceedWithStart(event: any, round: TransportRound, ignore: boolean = false) {
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
                                handler: () => {
                                    this.synchronise((updatedRound: TransportRound) => this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
                                        round: updatedRound,
                                        unpreparedDeliveries: () => this.unpreparedDeliveries(event, updatedRound)
                                    }), round);
                                }
                            }]
                        });
                    } else if(!ignore) {
                        this.unpreparedDeliveries(event, round);
                    } else {
                        const options = {
                            params: {
                                round: round.id
                            }
                        }
                        this.loadingService
                            .presentLoadingWhile({
                                event: () => this.apiService.requestApi(ApiService.START_DELIVERY_ROUND, options)
                            })
                            .subscribe(({success, msg, round: apiRound}) => {
                                if (round) {
                                    Object.assign(round, apiRound);
                                }

                                if (msg) {
                                    this.toastService.presentToast(msg);
                                }

                                if (success) {
                                    this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                        round,
                                        mode: TransportCardMode.STARTABLE,
                                    });
                                }

                                event.stopPropagation();
                            });
                    }
                }
            });
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de débuter la tournée');
        }
    }

    public synchronise(callback: (updatedRound: TransportRound) => void = undefined, currentRound: TransportRound = undefined): void {
        if (this.networkService.hasNetwork()) {
            this.loading = true;
            zip(
                this.loadingService.presentLoading('Récupération des tournées en cours'),
                this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS)
            ).subscribe(([loading, rounds]: [HTMLIonLoadingElement, Array<TransportRound>]) => {
                loading.dismiss();

                for (const round of rounds) {
                    for (const transport of round.lines) {
                        transport.round = round;
                        if (transport.collect) {
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
                if(callback) {
                    const updatedRound = rounds.find(({id}) => id === currentRound.id);
                    callback(updatedRound);
                }
            });
        } else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public unpreparedDeliveries(event: any, round: TransportRound): void {
        if(round.ready_deliveries != round.total_ready_deliveries) {
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
                            this.proceedWithStart(event, round, true);
                        },
                        cssClass: 'alert-success'
                    }
                ],
            });
        } else {
            this.proceedWithStart(event, round, true);
        }
    }
}
