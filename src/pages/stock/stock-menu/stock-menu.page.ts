import {Component} from '@angular/core';
import {merge, Subscription, zip} from 'rxjs';
import {MenuConfig, ColumnNumber} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {map} from 'rxjs/operators';
import {NetworkService} from '@app/common/services/network.service';

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
    private deposeAlreadyNavigate: boolean;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.avoidSync = true;
        const self = this;
        this.menuConfig = [
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
                icon: 'manual-delivery.svg',
                label: 'Livraison manuelle',
                action: () => {
                    self.navService.push(NavPathEnum.MANUAL_DELIVERY);
                }
            },
            {
                icon: 'stock-transfer.svg',
                label: 'Transfert',
                action: () => {
                    this.navService.push(NavPathEnum.TRANSFER_LIST);
                }
            },
            {
                icon: 'manual-transfer.svg',
                label: 'Transfert manuel',
                action: () => {
                    this.navigateToPriseDeposePage()
                }
            },
            {
                icon: 'collect.svg',
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
            this.refreshSlidersData();
        }


        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.currentNavParams.get('goToDropDirectly')));

        if (goToDropDirectly) {
            this.deposeAlreadyNavigate = true;
            this.navigateToPriseDeposePage(true);
        }
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
        if (this.networkService.hasNetwork()) {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe(
                ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                    this.refreshSlidersData();
                },
                (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    this.refreshSlidersData();
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
                });
        }
        else {
            this.loading = false;
            this.refreshSlidersData();
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public goToDrop() {
        this.navService
            .push(NavPathEnum.STOCK_MENU, {
                goToDropDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }

    public refreshSlidersData(): void {
        if (!this.loading) {
            this.loading = true;
            zip(
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_TRANSFERS_TREATED),
                    this.sqliteService.count('transfer_order', ['treated <> 1'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_PREPARATIONS_TREATED),
                    this.sqliteService.count('preparation', ['date_end IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_COLLECTS_TREATED),
                    this.sqliteService.count('collecte', ['date_end IS NULL', 'location_to IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat}))),
                zip(
                    this.storageService.getCounter(StorageKeyEnum.COUNTERS_DELIVERIES_TREATED),
                    this.sqliteService.count('livraison', ['date_end IS NULL'])
                ).pipe(map(([treated, toTreat]) => ({treated, toTreat})))
            )
                .subscribe(
                    ([transfers, preparations, collects, deliveries]) => {
                        this.loading = false;
                        this.statsSlidersData = this.createSlidersData(transfers, preparations, collects, deliveries);
                    },
                    () => {
                        this.loading = false;
                    });
        }
    }

    private createSlidersData(transfers, preparations, collects, deliveries): Array<StatsSlidersData|[StatsSlidersData,StatsSlidersData,StatsSlidersData,StatsSlidersData]> {
        const sToTreat = {
            transfers: transfers.toTreat > 1 ? 's' : '',
            preparations: preparations.toTreat > 1 ? 's' : '',
            collects: collects.toTreat > 1 ? 's' : '',
            deliveries: deliveries.toTreat > 1 ? 's' : '',
        };
        const sTreated = {
            transfers: transfers.treated > 1 ? 's' : '',
            preparations: preparations.treated > 1 ? 's' : '',
            collects: collects.treated > 1 ? 's' : '',
            deliveries: deliveries.treated > 1 ? 's' : '',
        };
        return [
            [
                {label: `Transfert${sToTreat.transfers} à traiter`, counter: transfers.toTreat},
                {label: `Préparation${sToTreat.preparations} à traiter`, counter: preparations.toTreat},
                {label: `Collecte${sToTreat.collects} à traiter`, counter: collects.toTreat},
                {label: `Livraison${sToTreat.deliveries} à traiter`, counter: deliveries.toTreat},
            ],
            [
                {
                    label: `Transfert${sTreated.transfers} traité${sTreated.transfers}`,
                    counter: transfers.treated
                },
                {
                    label: `Préparation${sTreated.preparations} traitée${sTreated.preparations}`,
                    counter: preparations.treated
                },
                {
                    label: `Collecte${sTreated.collects} traitée${sTreated.collects}`,
                    counter: collects.treated
                },
                {
                    label: `Livraison${sTreated.deliveries} traitée${sTreated.deliveries}`,
                    counter: deliveries.treated
                },
            ],
        ];
    }


    public navigateToPriseDeposePage(goToDropDirectly: boolean = false): void {
        this.navService
            .push(NavPathEnum.STOCK_MOVEMENT_MENU, {
                fromStock: true,
                goToDropDirectly
            });
    }

}
