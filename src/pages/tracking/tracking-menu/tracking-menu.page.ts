import {Component} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform, ViewWillEnter} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageService} from "@app/common/services/storage/storage.service";
import {zip} from "rxjs";
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {TranslationService} from '@app/common/services/translations.service';

@Component({
    selector: 'wii-tracking-menu',
    templateUrl: './tracking-menu.page.html',
    styleUrls: ['./tracking-menu.page.scss'],
})
export class TrackingMenuPage extends PageComponent implements ViewWillEnter {

    public menuConfig: Array<MenuConfig> = [];
    public statsSlidersData: Array<StatsSlidersData>;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        super.ionViewWillEnter();

        zip(
            this.storageService.getRight(StorageKeyEnum.RIGHT_GROUP),
            this.storageService.getRight(StorageKeyEnum.RIGHT_UNGROUP),
            this.storageService.getCounter(StorageKeyEnum.COUNTERS_DISPATCHES_TREATED),
            this.sqliteService.count('dispatch', ['treatedStatusId IS NULL OR partial = 1']),

            this.translationService.get('acheminement')
        ).subscribe(
            ([group, ungroup, treatedDispatches, toTreatDispatches, dispatch]) => {
                this.menuConfig.push(
                    {
                        icon: 'stock-transfer.svg',
                        label: TranslationService.Translate(dispatch, 'Acheminements'),
                        action: () => {
                            this.navService.push(NavPathEnum.DISPATCH_MENU);
                        }
                    },
                    {
                        icon: 'tracking.svg',
                        label: 'Mouvements',
                        action: () => {
                            this.navService.push(NavPathEnum.TRACKING_MOVEMENT_MENU);
                        }
                });
                if(group) {
                    this.menuConfig.push({
                        icon: 'group.svg',
                        label: 'Groupage',
                        action: () => {
                            if(this.network.type !== 'none') {
                                this.navService.push(NavPathEnum.GROUP_SCAN_GROUP);
                            } else {
                                this.toastService.presentToast('Une connexion internet est requise pour accéder à cette fonctionnalité.');
                            }
                        }
                    });
                }
                if(ungroup) {
                    this.menuConfig.push({
                        icon: 'ungroup.svg',
                        label: 'Dégroupage',
                        action: () => {
                            if(this.network.type !== 'none') {
                                this.navService.push(NavPathEnum.UNGROUP_SCAN_LOCATION);
                            } else {
                                this.toastService.presentToast('Une connexion internet est requise pour accéder à cette fonctionnalité.');
                            }
                        }
                    });
                }
                this.statsSlidersData = this.createStatsSlidersData(treatedDispatches, toTreatDispatches);
            }
        );
    }

    private createStatsSlidersData(treatedDispatchesCounter: number, toTreatedDispatchesCounter: number): Array<StatsSlidersData> {
        const sTreatedDispatches = treatedDispatchesCounter > 1 ? 's' : '';
        const sToTreatedDispatches = toTreatedDispatchesCounter > 1 ? 's' : '';
        return [
            { label: `Acheminement${sToTreatedDispatches} à traiter`, counter: toTreatedDispatchesCounter },
            { label: `Acheminement${sTreatedDispatches} traité${sTreatedDispatches}`, counter: treatedDispatchesCounter }
        ];
    }
}
