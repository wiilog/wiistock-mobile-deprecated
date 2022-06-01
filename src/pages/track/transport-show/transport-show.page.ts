import {Component} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {ViewWillEnter} from '@ionic/angular';
import {NavService} from '@app/common/services/nav/nav.service';
import {TransportRoundLine} from '@entities/transport-round-line';
import {ToastService} from '@app/common/services/toast.service';
import {TransportCardMode} from '@app/common/components/transport-card/transport-card.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TransportRound} from "@entities/transport-round";

@Component({
    selector: 'wii-transport-show',
    templateUrl: './transport-show.page.html',
    styleUrls: ['./transport-show.page.scss'],
})
export class TransportShowPage extends PageComponent implements ViewWillEnter {

    public modeViewOnly = TransportCardMode.VIEW;

    public transport: TransportRoundLine;
    public round: TransportRound;
    public packs: Array<any>;

    public shouldDisplayFreeFields: boolean;

    public mode: TransportCardMode;

    public constructor(private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.mode = this.currentNavParams.get('mode');
        this.transport = this.currentNavParams.get('transport');
        this.round = this.currentNavParams.get('round');

        this.packs = this.transport.packs.filter(({rejected}) => !rejected);
        this.shouldDisplayFreeFields = this.transport.free_fields.filter(freeField => freeField.value !== '').length > 0;
    }

    public fail(): void {
        this.navService.push(NavPathEnum.TRANSPORT_FAILURE, {
            transport: this.transport,
            round: this.round,
        });
    }

    public depositOrCollect(): void {
        if(this.transport.kind === `collect`) {
            this.navService.push(NavPathEnum.TRANSPORT_COLLECT_NATURES, {
                transport: this.transport,
            });
        } else {
            this.navService.push(NavPathEnum.TRANSPORT_PACK_DELIVER, {
                transport: this.transport,
            });
        }
    }

}
