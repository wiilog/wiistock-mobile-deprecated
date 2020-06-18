import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Emplacement} from '@entities/emplacement';
import {NavService} from '@app/common/services/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {from} from 'rxjs';
import {InventoryArticlesPageRoutingModule} from '@pages/stock/inventory/inventory-articles/inventory-articles-routing.module';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {InventoryService} from '@app/common/services/inventory.service';


@Component({
    selector: 'wii-inventory-locations-anomalies',
    templateUrl: './inventory-locations-anomalies-page.component.html',
    styleUrls: ['./inventory-locations-anomalies-page.component.scss'],
})
export class InventoryLocationsAnomaliesPage implements CanLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public isInventoryManager: boolean;

    public listConfig: {body: Array<ListPanelItemConfig>; boldValues};
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public loading: boolean;

    private locations: Array<Emplacement>;

    public constructor(private sqliteService: SqliteService,
                       private navService: NavService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private inventoryService: InventoryService) {
        this.listConfig = {
            body: [],
            boldValues: ['label']
        };
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.listConfig.body = [];

        this.inventoryService.getData(true).subscribe(({isInventoryManager, loader, locations}) => {
            this.isInventoryManager = isInventoryManager;
            this.locations = locations;
            this.listConfig.body = this.createListConfig();
            this.inventoryService.refreshSubTitle(this.locations, true);

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
            anomalyMode: true
        });
    }
}
