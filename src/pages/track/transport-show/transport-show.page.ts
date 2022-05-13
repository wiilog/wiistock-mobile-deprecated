import {Component} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRoundLine} from '@entities/transport-round-line';
import {ApiService} from '@app/common/services/api.service';
import {NetworkService} from '@app/common/services/network.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';

@Component({
    selector: 'wii-transport-show',
    templateUrl: './transport-show.page.html',
    styleUrls: ['./transport-show.page.scss'],
})
export class TransportShowPage extends PageComponent implements ViewWillEnter {

    public modeViewOnly = TransportCardMode.VIEW;

    public transport: TransportRoundLine;

    public shouldDisplayFreeFields: boolean;

    public mode: TransportCardMode;

    public constructor(private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter() {
        this.mode = this.currentNavParams.get('mode');
        this.transport = this.currentNavParams.get('transport');
console.log(this.transport);
        this.shouldDisplayFreeFields = this.transport.free_fields.filter(freeField => freeField.value !== '').length > 0;
    }

    public fail() {
        this.toastService.presentToast(`Non implémenté`);
    }

    public depositOrCollect() {
        this.toastService.presentToast(`Non implémenté`);
    }

}
