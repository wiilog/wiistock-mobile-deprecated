import {Component} from '@angular/core';
import {merge, Subscription, zip} from 'rxjs';
import {MenuConfig, ColumnNumber} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {map} from 'rxjs/operators';

@Component({
    selector: 'wii-stock-menu',
    templateUrl: './stock-menu.page.html',
    styleUrls: ['./stock-menu.page.scss'],
})
export class StockMenuPage extends PageComponent {
    public readonly ColumnNumber = ColumnNumber;
    public statsSlidersData: Array<StatsSlidersData|[StatsSlidersData,StatsSlidersData,StatsSlidersData,StatsSlidersData]>;

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.avoidSync = true;
        const self = this;
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Transfert',
                action: () => {
                    self.navService.push(NavPathEnum.TRANSFER_MENU);
                }
            },
            {
                icon: 'preparation.svg',
                label: 'Préparation',
                action: () => {
                    self.navService.push(NavPathEnum.PREPARATION_MENU);
                }
            },
            {
                icon: 'delivery.svg',
                label: 'Livraison',
                action: () => {
                    self.navService.push(NavPathEnum.LIVRAISON_MENU);
                }
            },
            {
                icon: 'collecte.svg',
                label: 'Collecte',
                action: () => {
                    this.navService.push(NavPathEnum.COLLECTE_MENU, {
                        avoidSync: () => {
                            self.setAvoidSync(true);
                        },
                        goToDrop: () => {
                            self.goToDrop();
                        }
                    });
                }
            },
            {
                icon: 'inventory.svg',
                label: 'Inventaire',
                action: () => {
                    self.navService.push(NavPathEnum.INVENTORY_LOCATIONS);
                }
            }
        ];
    }

    public ionViewWillEnter(): void {
        this.navigationSubscription = merge(
            this.mainHeaderService.navigationChange$,
            this.platform.backButton
        )
            .subscribe(() => {
                this.setAvoidSync(true);
            });

        if (!this.avoidSync) {
            this.synchronise();
        }
        else {
            this.setAvoidSync(false);
        }

        this.refreshSlidersData();
    }

    public ionViewWillLeave(): void {
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
            this.navigationSubscription = undefined;
        }
    }

    public synchronise(): void {
        if (this.network.type !== 'none') {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe(
                ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                },
                (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
                });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public goToDrop() {
        this.navService
            .push(NavPathEnum.TRANSFER_MENU, {
                goToDropDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }

    public refreshSlidersData(): void {
        zip(
            zip(
                this.storageService.getCounter(StorageKeyEnum.COUNTERS_TRANSFERS_TREATED),
                this.sqliteService.count('transfer_order', ['treated <> 1'])
            ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
            zip(
                this.storageService.getCounter(StorageKeyEnum.COUNTERS_PREPARATIONS_TREATED),
                this.sqliteService.count('preparation', ['date_end IS NOT NULL'])
            ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
            zip(
                this.storageService.getCounter(StorageKeyEnum.COUNTERS_COLLECTS_TREATED),
                this.sqliteService.count('collecte', ['date_end IS NOT NULL', 'location_to IS NULL'])
            ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
            zip(
                this.storageService.getCounter(StorageKeyEnum.COUNTERS_DELIVERIES_TREATED),
                this.sqliteService.count('livraison', ['date_end IS NOT NULL'])
            ).pipe(map(([treated, toTreat]) => ({treated, toTreat})))
        )
            .subscribe(([transfers, preparations, collects, deliveries]) => {
                const sToTreat = {
                    transfers: transfers.toTreat > 1 ? 's' : '',
                    preparations: preparations.toTreat > 1 ? 's' : '',
                    collects: collects.toTreat > 1 ? 's' : '',
                    deliveries: deliveries.toTreat > 1 ? 's' : '',
                };
                const sTreated = {
                    transfers: transfers.treated > 1 ? 's' : '',
                    preparations: preparations.toTreat > 1 ? 's' : '',
                    collects: collects.toTreat > 1 ? 's' : '',
                    deliveries: deliveries.toTreat > 1 ? 's' : '',
                };
                this.statsSlidersData = [
                    [
                        { label: `Transfert${sToTreat.transfers} à traiter`, counter: transfers.toTreat },
                        { label: `Préparation${sToTreat.preparations} à traiter`, counter: preparations.toTreat },
                        { label: `Collecte${sToTreat.collects} à traiter`, counter: collects.toTreat },
                        { label: `Livraison${sToTreat.deliveries} à traiter`, counter: deliveries.toTreat },
                    ],
                    [
                        { label: `Transfert${sTreated.transfers} traité${sTreated.transfers}`, counter: transfers.treated },
                        { label: `Préparation${sTreated.preparations} traitée${sTreated.preparations}`, counter: preparations.treated },
                        { label: `Collecte${sTreated.collects} traitée${sTreated.collects}`, counter: collects.treated },
                        { label: `Livraison${sTreated.deliveries} traitée${sTreated.deliveries}`, counter: deliveries.treated },
                    ],
                ];
            });
    }
}
