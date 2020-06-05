import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite.service';
import {Emplacement} from '@entities/emplacement';
import {NavService} from '@app/common/services/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {StorageService} from '@app/common/services/storage.service';
import {from, of, zip} from 'rxjs';
import {InventoryArticlesPageRoutingModule} from '@pages/stock/inventory/inventory-articles/inventory-articles-routing.module';
import {CanLeave} from '@app/guards/can-leave/can-leave';

@Component({
    selector: 'wii-inventory-locations',
    templateUrl: './inventory-locations.page.html',
    styleUrls: ['./inventory-locations.page.scss'],
})
export class InventoryLocationsPage implements CanLeave {

    public static readonly CURRENT_PATH: string = 'inventory-locations';

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public isInventoryManager: boolean;

    public listConfig: {body: Array<ListPanelItemConfig>; boldValues};
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public loading: boolean;

    public anomalyMode: boolean;

    private locations: Array<Emplacement>;

    public constructor(private sqliteService: SqliteService,
                       private navService: NavService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private storageService: StorageService) {
        this.listConfig = {
            body: [],
            boldValues: ['label']
        };
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.listConfig.body = [];

        const navParams = this.navService.getCurrentParams();
        this.anomalyMode = navParams.get('anomalyMode') || false;

        zip(
            this.loadingService.presentLoading('Chargement...'),
            this.sqliteService.findAll(this.anomalyMode ? '`anomalie_inventaire`' : '`article_inventaire`'),
            this.anomalyMode ? of(false) : this.storageService.getInventoryManagerRight()
        ).subscribe(([loader, articles, isInventoryManager]) => {
            this.isInventoryManager = isInventoryManager;
            this.locations = articles
                .reduce((acc, {location}) => ([
                    ...acc,
                    ...(acc.findIndex(({label: locationAlreadySaved}) => (locationAlreadySaved === location)) === -1
                        ? [{label: location}]
                        : [])
                ]), []);

            this.listConfig.body = this.createListConfig();
            this.refreshSubTitle();

            from(loader.dismiss()).subscribe(() => {
                this.loading = false;
            });
        });

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return !this.loading;
    }

    public checkAndTreatBarcode(barcode: string): void {
        const location = this.locations.find(({label}) => (label === barcode));
        if (location) {
            this.navigateToArticles(barcode);
        }
        else {
            this.toastService.presentToast('L\'emplacement scanné n\'est pas dans la liste');
        }
    }

    public navigateToAnomalies(): void {
        this.navService.push(InventoryLocationsPage.CURRENT_PATH, {
            anomalyMode: true
        });
    }

    private createListConfig(): Array<ListPanelItemConfig> {
        return this.locations.map(({label}) => ({
            infos: {
                label: {
                    label: 'Emplacement',
                    value: label
                }
            },
            pressAction: (clickedItem) => {
                this.onPressOnLocation(clickedItem);
            }
        }));
    }

    private onPressOnLocation({label: {value: location}}: { label?: { value?: string } }) {
        this.navigateToArticles(location);
    }

    private navigateToArticles(selectedLocation: string): void {
        this.navService.push(InventoryArticlesPageRoutingModule.PATH, {
            selectedLocation,
            anomalyMode: this.anomalyMode
        });
    }

    public refreshSubTitle(): void {
        const locationsLength = this.locations.length;
        this.mainHeaderService.emitSubTitle(
            locationsLength === 0
                ? (this.anomalyMode ? 'Toutes les anomalies ont été traitées' : 'Tous les inventaires sont à jour')
                : `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`
        );
    }
}
