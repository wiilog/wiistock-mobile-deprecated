import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRound} from "@entities/transport-round";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {ApiService} from "@app/common/services/api.service";
import * as moment from "moment";

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage extends PageComponent implements ViewWillEnter {

    public transportRoundsByDates: {
        [date: string]: Array<TransportRound>
    };

    public constructor(navService: NavService,
                       private apiService: ApiService,
                       private loadingService: LoadingService) {
        super(navService);
    }

    public ionViewWillEnter() {
        moment.locale('fr');
        zip(
            this.loadingService.presentLoading('Récupération des tournées en cours'),
            this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS)
        ).subscribe(([loading, rounds]: [HTMLIonLoadingElement, any]) => {
            loading.dismiss();
            console.log(rounds);
            this.transportRoundsByDates = rounds
                .sort(({date: desiredDate1}, {date: desiredDate2}) => {
                    const momentDesiredDate1 = moment(desiredDate1, 'DD/MM/YYYY')
                    const momentDesiredDate2 = moment(desiredDate2, 'DD/MM/YYYY')
                    return (
                        momentDesiredDate1.isBefore(momentDesiredDate2) ? -1 :
                            momentDesiredDate1.isAfter(momentDesiredDate2) ? 1 :
                                0
                    );
                })
                .reduce((rv, x) => {
                    (rv[x['date']] = rv[x['date']] || []).push(x);
                    return rv;
            }, {});

            console.log(this.transportRoundsByDates);
        });
    }

    public formatDate(date) {
        return moment(date, 'DD/MM/YYYY').format('dddd D MMMM YYYY');
    }

    public load(round) {

    }

    public start(round) {

    }

    public moveToRound(round) {

    }
}
