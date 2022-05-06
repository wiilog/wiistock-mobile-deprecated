import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRound} from "@entities/transport-round";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {ApiService} from "@app/common/services/api.service";
import * as moment from "moment";
import {ToastService} from "@app/common/services/toast.service";
import {NetworkService} from "@app/common/services/network.service";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";

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
                       private networkService: NetworkService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        moment.locale('fr');
        this.synchronise();
    }

    public formatDate(date): string {
        return moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY');
    }

    public load(round: TransportRound): void {
        this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD, {
            round
        });
    }

    public start(round): void {

    }

    public moveToRound(round): void {

    }

    public synchronise(): void {
        if (this.networkService.hasNetwork()) {
            this.loading = true;
            zip(
                this.loadingService.presentLoading('Récupération des tournées en cours'),
                this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS)
            ).subscribe(([loading, rounds]: [HTMLIonLoadingElement, any]) => {
                loading.dismiss();
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
