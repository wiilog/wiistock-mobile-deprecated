import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Observable} from 'rxjs';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {LoadingService} from '@app/services/loading.service';
import {from} from 'rxjs/observable/from';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {MainHeaderService} from '@app/services/main-header.service';
import {ArticleInventaire} from '@app/entities/article-inventaire';
import {SaisieInventaire} from '@app/entities/saisie-inventaire';
import moment from 'moment';
import {flatMap, map} from 'rxjs/operators';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {InventoryValidatePage} from "@pages/stock/inventory/inventory-validate/inventory-validate";
import {Anomalie} from "@app/entities/anomalie";


@IonicPage()
@Component({
    selector: 'page-inventory-article',
    templateUrl: 'inventory-article.html',
})
export class InventoryArticlePage {

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public listConfig: {body: Array<ListPanelItemConfig>; boldValues};
    public readonly scannerMode = BarcodeScannerModeEnum.ONLY_SCAN;

    public loading: boolean;

    private alreadyInitialized: boolean;

    private articles: Array<ArticleInventaire & Anomalie>;
    private selectedLocation: string;

    private anomalyMode: boolean;

    public constructor(private sqliteProvider: SqliteProvider,
                       private navParams: NavParams,
                       private navController: NavController,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService) {
        this.listConfig = {
            body: [],
            boldValues: ['barcode', 'reference']
        };
        this.alreadyInitialized = false;
    }

    public ionViewWillEnter(): void {
        this.loading = true;

        this.selectedLocation = this.navParams.get('selectedLocation');
        this.anomalyMode = this.navParams.get('anomalyMode') || false;

        if (!this.alreadyInitialized) {
            Observable.zip(
                this.loadingService.presentLoading('Chargement...'),
                this.sqliteProvider.findBy(
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

    public ionViewCanLeave(): boolean {
        return (!this.footerScannerComponent || !this.footerScannerComponent.isScanning) && !this.loading;
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
        return this.articles.map(({reference, barcode, quantity}) => ({
            infos: {
                reference: {
                    label: 'Référence',
                    value: reference
                },
                barcode: {
                    label: 'Code barre',
                    value: barcode
                },
                ...(
                    this.anomalyMode
                        ? {
                            quantity: {
                                label: 'Quantité',
                                value: `${quantity}`
                            }
                        }
                        : {}
                )
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
        this.navController.push(InventoryValidatePage, {
            selectedArticle,
            quantity: this.anomalyMode ? selectedArticle.quantity : undefined,
            validateQuantity: (quantity: number) => {
                const indexSelectedArticle = this.articles.findIndex(({barcode}) => (barcode === selectedArticle.barcode));
                this.loading = true;
                Observable.zip(
                    this.loadingService.presentLoading('Chargement...'),
                    this.validateQuantity(selectedArticle, quantity)
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
                            this.navController.pop();
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
            return this.sqliteProvider.update('`anomalie_inventaire`', {quantity, treated: '1'}, [`id = ${selectedArticle.id}`]);
        }
        else {
            let saisieInventaire: SaisieInventaire = {
                id: null,
                id_mission: selectedArticle.id_mission,
                date: moment().format(),
                reference: selectedArticle.reference,
                is_ref: selectedArticle.is_ref,
                quantity,
                location: selectedArticle.location,
            };

            return Observable.zip(
                this.sqliteProvider.insert('`saisie_inventaire`', saisieInventaire),
                this.sqliteProvider.deleteBy('`article_inventaire`', selectedArticle.id)
            );
        }
    }
}
