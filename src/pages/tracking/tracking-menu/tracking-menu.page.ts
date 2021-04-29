import {Component} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform, ViewWillEnter} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {PriseDeposeMenuPageRoutingModule} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu-routing.module';
import {PageComponent} from '@pages/page.component';
import {DispatchMenuPageRoutingModule} from '@pages/tracking/dispatch/dispatch-menu/dispatch-menu-routing.module';
import {UngroupScanLocationPageRoutingModule} from "@pages/tracking/ungroup/ungroup-scan-location/ungroup-scan-location-routing.module";
import {GroupScanGroupPageRoutingModule} from "@pages/tracking/group/group-scan-group/group-scan-group-routing.module";
import {StorageService} from "@app/common/services/storage/storage.service";
import {zip} from "rxjs";

@Component({
    selector: 'wii-tracking-menu',
    templateUrl: './tracking-menu.page.html',
    styleUrls: ['./tracking-menu.page.scss'],
})
export class TrackingMenuPage extends PageComponent implements ViewWillEnter {

    public menuConfig: Array<MenuConfig>;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       navService: NavService,
                       private storageService: StorageService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Acheminements',
                action: () => {
                    this.navService.push(DispatchMenuPageRoutingModule.PATH);
                }
            },
            {
                icon: 'tracking.svg',
                label: 'Mouvements',
                action: () => {
                    this.navService.push(PriseDeposeMenuPageRoutingModule.PATH, {fromStock: false});
                }
            },
        ];

        zip(
            this.storageService.getGroupAccessRight(),
            this.storageService.getUngroupAccessRight(),
        ).subscribe(
            ([group, ungroup]) => {
                if(group) {
                    this.menuConfig.push({
                        icon: 'group.svg',
                        label: 'Groupage',
                        action: () => {
                            this.navService.push(GroupScanGroupPageRoutingModule.PATH);
                        }
                    });
                }
                if(ungroup) {
                    this.menuConfig.push({
                        icon: 'ungroup.svg',
                        label: 'Dégroupage',
                        action: () => {
                            this.navService.push(UngroupScanLocationPageRoutingModule.PATH);
                        }
                    });
                }
            }
        )
    }
}
