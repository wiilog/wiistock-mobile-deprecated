import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRound} from "@entities/transport-round";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {ApiService} from "@app/common/services/api.service";

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage extends PageComponent implements ViewWillEnter {

    public transportRounds : Array<TransportRound>;

    public constructor(navService: NavService,
                       private apiService: ApiService,
                       private loadingService: LoadingService) {
        super(navService);
    }

    public ionViewWillEnter() {
        zip(
            this.loadingService.presentLoading('Récupération des tournées en cours'),
            this.apiService.requestApi(ApiService.GET_TRANSPORT_ROUNDS)
        ).subscribe(([loading, rounds]: [HTMLIonLoadingElement, Array<TransportRound>]) => {
            loading.dismiss();
            this.transportRounds = rounds;
        });
    }

    public load(round) {

    }

    public start(round) {

    }
}
