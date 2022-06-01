import {Component} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {TransportRound} from '@entities/transport-round';

@Component({
    selector: 'wii-transport-deposit-menu',
    templateUrl: './transport-deposit-menu.page.html',
    styleUrls: ['./transport-deposit-menu.page.scss'],
})
export class TransportDepositMenuPage extends PageComponent implements ViewWillEnter {

    public round: TransportRound;

    public constructor(private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter() {
        this.round = this.currentNavParams.get('round');
    }

    public delivery() {
        this.toastService.presentToast(`Non implémenté`);
    }

    public collect() {
        this.toastService.presentToast(`Non implémenté`);
    }

}
