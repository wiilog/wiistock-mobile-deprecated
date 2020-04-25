import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Observable} from 'rxjs';
import {ToastService} from '@app/services/toast.service';
import {StorageService} from '@app/services/storage.service';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {LoadingService} from '@app/services/loading.service';
import {from} from 'rxjs/observable/from';
import {Emplacement} from '@app/entities/emplacement';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {InventoryArticlePage} from "@pages/stock/inventory/inventory-article/inventory-article";


@IonicPage()
@Component({
    selector: 'page-inventory-locations',
    templateUrl: 'inventory-locations.html',
})
export class InventoryLocationsPage {

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public isInventoryManager: boolean;

    public listConfig: {body: Array<ListPanelItemConfig>; boldValues};
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public loading: boolean;

    private locations: Array<Emplacement>;

    public constructor(private sqliteProvider: SqliteProvider,
                       private navController: NavController,
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

        Observable.zip(
            this.loadingService.presentLoading('Chargement...'),
            this.sqliteProvider.findAll('`article_inventaire`'),
            this.storageService.getInventoryManagerRight()
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

    public ionViewCanLeave(): boolean {
        return (!this.footerScannerComponent || !this.footerScannerComponent.isScanning) && !this.loading;
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
        this.navController.push(InventoryArticlePage, {
            selectedLocation
        });
    }

    public refreshSubTitle(): void {
        const locationsLength = this.locations.length;
        this.mainHeaderService.emitSubTitle(locationsLength === 0
            ? 'Tous les inventaires sont à jour'
            : `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`)
    }
}
