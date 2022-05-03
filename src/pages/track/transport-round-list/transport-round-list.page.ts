import {Component} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {TransportRound} from "@entities/transport-round";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {TransportRoundLine} from "@entities/transport-round-line";

@Component({
    selector: 'wii-transport-round-list',
    templateUrl: './transport-round-list.page.html',
    styleUrls: ['./transport-round-list.page.scss'],
})
export class TransportRoundListPage extends PageComponent implements ViewWillEnter {

    private transportRounds : Array<TransportRound>;
    private transportRoundLines : Array<TransportRoundLine>;

    public constructor(navService: NavService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService) {
        super(navService);
    }

    public ionViewWillEnter() {
        zip(
            this.loadingService.presentLoading('Récupération des tournées en cours'),
            this.sqliteService.findBy('transport_round'),
            this.sqliteService.findBy('transport_round_line')
        ).subscribe(([loading, rounds, lines]: [HTMLIonLoadingElement, Array<TransportRound>, Array<TransportRoundLine>]) => {
            loading.dismiss();
            this.transportRounds = rounds;
            this.transportRoundLines = lines;
            console.log(this.transportRounds);
            console.log(this.transportRoundLines);
        });
    }
}
