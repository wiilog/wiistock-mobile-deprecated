import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Anomalie} from '@entities/anomalie';
import {ArticleInventaire} from '@entities/article-inventaire';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {from, Observable, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {SaisieInventaire} from '@entities/saisie-inventaire';
import * as moment from 'moment';
import {InventoryValidatePageRoutingModule} from '@pages/stock/inventory/inventory-validate/inventory-validate-routing.module';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-inventory-articles',
    templateUrl: './inventory-articles.page.html',
    styleUrls: ['./inventory-articles.page.scss'],
})
export class InventoryArticlesPage extends PageComponent implements CanLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public listConfig: {body: Array<ListPanelItemConfig>; boldValues};
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public loading: boolean;

    private alreadyInitialized: boolean;

    private articles: Array<ArticleInventaire & Anomalie>;
    private selectedLocation: string;

    private anomalyMode: boolean;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.listConfig = {
            body: [],
            boldValues: ['barcode', 'reference']
        };
        this.alreadyInitialized = false;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.selectedLocation = this.currentNavParams.get('selectedLocation');
        this.anomalyMode = this.currentNavParams.get('anomalyMode') || false;

        if (!this.alreadyInitialized) {
            zip(
                this.loadingService.presentLoading('Chargement...'),
                this.sqliteService.findBy(
                    this.anomalyMode ? '`anomalie_inventaire`' : '`article_inventaire`',
                    [`location = '${this.selectedLocation}'`]
                )
            ).subscribe(([loader, articles]) => {
                this.articles = articles;

                this.listConfig.body = this.createListBodyConfig();
                this.refreshSubTitle();

                from(loader.dismiss()).subscribe(() => {
                    this.loading = false;
                    this.alreadyInitialized = true;
                });
            });
        }
        else {
            this.loading = false;
        }

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

    public checkAndTreatBarcode(barcodeScanned: string): void {
        const articleScanned = this.articles.find(({barcode}) => (barcodeScanned === barcode));
        if (articleScanned) {
            this.navigateToInventoryValidate(articleScanned);
        }
        else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste');
        }
    }

    private createListBodyConfig(): Array<ListPanelItemConfig> {
        return this.articles.map(({reference, barcode}) => ({
            infos: {
                reference: {
                    label: 'Référence',
                    value: reference
                },
                barcode: {
                    label: 'Code barre',
                    value: barcode
                }
            },
            pressAction: (clickedItem) => {
                this.onPressOnArticle(clickedItem);
            }
        }));
    }

    private onPressOnArticle({barcode: {value: barcodeScanned}}: { barcode?: { value?: string } }) {
        const articleScanned = this.articles.find(({barcode}) => (barcodeScanned === barcode));
        this.navigateToInventoryValidate(articleScanned);
    }

    private navigateToInventoryValidate(selectedArticle: ArticleInventaire&Anomalie): void {
        const self = this;
        this.navService.push(InventoryValidatePageRoutingModule.PATH, {
            selectedArticle,
            validateQuantity: (quantity: number) => {
                const indexSelectedArticle = this.articles.findIndex(({barcode}) => (barcode === selectedArticle.barcode));
                this.loading = true;
                zip(
                    this.loadingService.presentLoading('Chargement...'),
                    self.validateQuantity(selectedArticle, quantity)
                )
                    .pipe(
                        flatMap(([loader]) => {
                            if (indexSelectedArticle > -1) {
                                this.articles.splice(indexSelectedArticle, 1);
                            }

                            this.listConfig.body = this.createListBodyConfig();

                            return this.localDataManager
                                .sendFinishedProcess(this.anomalyMode ? 'inventoryAnomalies' : 'inventory')
                                .pipe(map(() => loader));
                        }),
                        flatMap((loader) => from(loader.dismiss()))
                    )
                    .subscribe(() => {
                        this.loading = false;
                        if (this.articles.length === 0) {
                            this.navService.pop();
                        }
                    });
            }
        });
    }

    public refreshSubTitle(): void {
        const articlesLength = this.articles.length;
        this.mainHeaderService.emitSubTitle(articlesLength === 0
            ? 'Les inventaires pour cet emplacements sont à jour'
            : `${articlesLength} article${articlesLength > 1 ? 's' : ''}`)
    }

    public validateQuantity(selectedArticle: ArticleInventaire&Anomalie, quantity: number): Observable<any> {
        if (this.anomalyMode) {
            return this.sqliteService.update('`anomalie_inventaire`', {quantity, treated: '1'}, [`id = ${selectedArticle.id}`]);
        }
        else {
            let saisieInventaire: SaisieInventaire = {
                id: null,
                id_mission: selectedArticle.id_mission,
                date: moment().format(),
                bar_code: selectedArticle.barcode,
                is_ref: selectedArticle.is_ref,
                quantity,
                location: selectedArticle.location,
            };

            return zip(
                this.sqliteService.insert('`saisie_inventaire`', saisieInventaire),
                this.sqliteService.deleteBy('`article_inventaire`', [`id = ${selectedArticle.id}`])
            );
        }
    }
}
