import {Component} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {TransportRound} from '@entities/transport-round';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'wii-transport-deposit-menu',
    templateUrl: './transport-deposit-menu.page.html',
    styleUrls: ['./transport-deposit-menu.page.scss'],
})
export class TransportDepositMenuPage extends PageComponent implements ViewWillEnter {

    public round: TransportRound;
    public collectedPacksLocations: Array<number>;
    public undeliveredPacksLocations: Array<number>;

    public constructor(private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter() {
        this.round = this.currentNavParams.get('round');
        this.collectedPacksLocations = this.currentNavParams.get('collectedPacksLocations');
        this.undeliveredPacksLocations = this.currentNavParams.get('undeliveredPacksLocations');
    }

    public delivery() {
        this.navService.push(NavPathEnum.TRANSPORT_DEPOSIT_PACKS, {
            round: this.round,
            undeliveredPacksLocations: this.undeliveredPacksLocations
        });
    }

    public collect() {
        this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
            round: this.round,
            collectedPacksLocations: this.collectedPacksLocations
        });
    }
}
