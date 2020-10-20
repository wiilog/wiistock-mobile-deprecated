import {Component} from '@angular/core';
import {merge, Subscription} from 'rxjs';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {ManualTransferMenuPageRoutingModule} from '@pages/transfer/manual-transfer/manual-transfer-menu-routing.module';
import {PageComponent} from '@pages/page.component';
import {DispatchMenuPageRoutingModule} from '@pages/tracking/dispatch/dispatch-menu/dispatch-menu-routing.module';

@Component({
    selector: 'wii-tracking-menu',
    templateUrl: './tracking-menu.page.html',
    styleUrls: ['./tracking-menu.page.scss'],
})
export class TrackingMenuPage extends PageComponent {

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        const self = this;
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Acheminements',
                action: () => {
                    self.navService.push(DispatchMenuPageRoutingModule.PATH);
                }
            },
            {
                icon: 'tracking.svg',
                label: 'Mouvements',
                action: () => {
                    this.navService.push(ManualTransferMenuPageRoutingModule.PATH, {fromStock: false});
                }
            }
        ];
    }
}
