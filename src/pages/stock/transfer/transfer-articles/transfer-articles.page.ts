import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {flatMap, map} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {TransferOrderArticle} from '@entities/transfer-order-article';
import {LoadingService} from '@app/common/services/loading.service';
import {TransferOrder} from '@entities/transfer-order';
import {TransferValidatePageRoutingModule} from '@pages/stock/transfer/transfer-validate/transfer-validate-routing.module';


@Component({
    selector: 'wii-transfer-article',
    templateUrl: './transfer-articles.page.html',
    styleUrls: ['./transfer-articles.page.scss'],
})
export class TransferArticlesPage extends PageComponent {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public headerConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };

    public loader: HTMLIonLoadingElement;

    private transferOrder: TransferOrder;
    private treatedArticles: Array<TransferOrderArticle>;
    private toTreatArticles: Array<TransferOrderArticle>;

    private loadingSubscription: Subscription;

    public constructor(private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        if (!this.transferOrder
            || !this.headerConfig
            || !this.treatedArticles
            || !this.toTreatArticles) {
            this.transferOrder = this.currentNavParams.get('transferOrder');

            this.unsubscribeLoading();
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    flatMap((loader) => (
                        this.sqliteService
                            .findBy('transfer_order_article', [`transfer_order_id = ${this.transferOrder.id}`])
                            .pipe(map((articles) => [loader, articles]))
                    ))
                )
                .subscribe(([loader, transferOrderArticles]: [HTMLIonLoadingElement, Array<TransferOrderArticle>]) => {
                    this.loader = loader;

                    this.listBoldValues = ['barCode', 'label', 'reference', 'location', 'quantity'];
                    this.headerConfig = {
                        leftIcon: {
                            name: 'transfer.svg',
                            color: 'tertiary'
                        },
                        title: `Ordre de transfert ${this.transferOrder.number}`,
                        subtitle: [
                            `Destination : ${this.transferOrder.destination ? this.transferOrder.destination : ''}`,
                            `Demandeur : ${this.transferOrder.requester ? this.transferOrder.requester : ''}`
                        ]
                    };

                    this.toTreatArticles = transferOrderArticles;
                    this.treatedArticles = [];

                    this.refreshListTreatedConfig();
                    this.refreshListToTreatConfig();

                    if (this.footerScannerComponent) {
                        this.footerScannerComponent.fireZebraScan();
                    }

                    this.unsubscribeLoading();
                });
        }
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public validate(): void {
        if (this.treatedArticles.length === 0 ||
            this.toTreatArticles.length > 0) {
            this.toastService.presentToast('Veuillez terminer le traitement du transfert.');
        }
        else {
            this.navService.push(TransferValidatePageRoutingModule.PATH, {
                transferOrder: this.transferOrder,
                onValidate: () => {
                    this.navService.pop();
                }
            })
        }
    }

    public testIfBarcodeEquals(search: number|string, isIndex: boolean = false): void {
        const articleIndex: number = isIndex
            ? (search as number)
            : this.toTreatArticles.findIndex(({barcode}) => (barcode === search));
        if (articleIndex > -1) {
            this.treatedArticles.unshift(this.toTreatArticles[articleIndex]);
            this.toTreatArticles.splice(articleIndex, 1);

            this.refreshListToTreatConfig();
            this.refreshListTreatedConfig();

            this.changeDetector.detectChanges();
        }
        else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private refreshListToTreatConfig(): void {
        const pickedArticlesNumber = (this.toTreatArticles ? this.toTreatArticles.length : 0);
        const pickedArticlesPlural = pickedArticlesNumber > 1 ? 's' : '';
        this.listToTreatConfig = {
            header: {
                title: 'À tranférer',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} à scanner`,
                leftIcon: {
                    name: 'download.svg',
                    color: 'tertiary-light'
                }
            },
            body: this.toTreatArticles.map((article: TransferOrderArticle, index: number) => ({
                infos: this.createArticleInfo(article),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => {
                        this.testIfBarcodeEquals(index, true);
                    }
                }
            }))
        };
    }

    private refreshListTreatedConfig(): void {
        const pickedArticlesNumber = (this.treatedArticles ? this.treatedArticles.length : 0);
        const pickedArticlesPlural = pickedArticlesNumber > 1 ? 's' : '';
        this.listTreatedConfig = {
            header: {
                title: 'Transféré',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} scanné${pickedArticlesPlural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'tertiary'
                },
                rightIcon: {
                    name: 'check.svg',
                    color: 'success',
                    action: () => {
                        this.validate()
                    }
                }
            },
            body: this.treatedArticles.map((article: TransferOrderArticle) => ({
                infos: this.createArticleInfo(article)
            }))
        };
    }

    private createArticleInfo({barcode, label, reference, location, quantity}: TransferOrderArticle): {[name: string]: { label: string; value: string; }} {
        return {
            barCode: {
                label: 'Code barre',
                value: barcode
            },
            reference: {
                label: 'Référence',
                value: reference
            },
            label: {
                label: 'Libellé',
                value: label
            },
            location: {
                label: 'Emplacement',
                value: location
            },
            quantity: {
                label: 'Quantité',
                value: `${quantity}`
            }
        };
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loader) {
            this.loader.dismiss();
            this.loader = undefined;
        }
    }
}
