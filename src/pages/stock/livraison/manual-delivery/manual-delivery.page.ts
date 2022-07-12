import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ApiService} from '@app/common/services/api.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NetworkService} from '@app/common/services/network.service';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {
    FormPanelSelectComponent
} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {
    FormPanelInputComponent
} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {Emplacement} from '@entities/emplacement';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";


@Component({
    selector: 'wii-manual-delivery',
    templateUrl: './manual-delivery.page.html',
    styleUrls: ['./manual-delivery.page.scss'],
})
export class ManualDeliveryPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;
    public readonly scannerType: SelectItemTypeEnum = SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES;

    private selectedArticles: Array<{
        id: number;
        barCode: string;
        label: string;
        reference: string;
        typeQuantity: string;
        location: string;
        quantity: number;
    }>;

    public listBoldValues?: Array<string>;
    public headerConfig?: HeaderConfig;
    public listConfig?: ListPanelItemConfig[];
    public formConfig: Array<FormPanelParam>;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.listBoldValues = ['reference', 'label', 'barCode', 'location', 'quantity'];

        this.selectedArticles = [];
        this.headerConfig = this.createHeaderConfig();
        this.listConfig = this.createBodyConfig();

        this.formConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: null,
                    inputConfig: {
                        required: true,
                        defaultIfSingle: true,
                        searchType: SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE,
                        requestParams: ['to_delete IS NULL'],
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type'
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Commentaire',
                    name: 'comment',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
        ];
    }

    public addArticle(article: string) {
        const params = {
            barCode: article,
        };

        return this.apiService.requestApi(ApiService.GET_ARTICLES, {params})
            .subscribe(response => {
                if(response.success) {
                    if(response.article) {
                        this.selectedArticles.push(response.article);

                        this.headerConfig = this.createHeaderConfig();
                        this.listConfig = this.createBodyConfig();
                    } else {
                        this.toastService.presentToast(`Vous ne pouvez pas ajouter de référence`);
                    }
                } else {
                    this.toastService.presentToast(`L'article n'existe pas ou n'est pas disponible pour être mis dans une livraison`);
                }
            });
    }

    public validate(): void {
        const error = this.selectedArticles.length === 0
            ? 'Vous devez selectionner au moins un article'
            : this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        } else {
            const {type, comment} = this.formPanelComponent.values;

            this.navService.push(NavPathEnum.MANUAL_DELIVERY_LOCATION, {
                livraison: {
                    type,
                    comment,
                    articles: this.selectedArticles,
                }
            });
        }
    }

    private createHeaderConfig(): HeaderConfig {
        const articlesPlural = this.selectedArticles.length > 1 ? 's' : '';
        return {
            title: 'Livré',
            info: `${this.selectedArticles.length} article${articlesPlural} scanné${articlesPlural}`,
            leftIcon: {
                name: 'upload.svg',
                color: 'list-yellow-light'
            },
            rightIconLayout: 'horizontal',
            rightIcon: [
                {
                    color: 'primary',
                    name: 'scan-photo.svg',
                    action: () => {
                        this.footerScannerComponent.scan();
                    }
                },
            ],
        };
    }

    private createBodyConfig(): Array<ListPanelItemConfig> {
        return this.selectedArticles.map((article, index: number) => ({
            infos: {
                reference: {
                    label: 'Référence article',
                    value: article.reference
                },
                label: {
                    label: 'Libellé',
                    value: article.label
                },
                barCode: {
                    label: 'Code barre',
                    value: article.barCode
                },
                ...(
                    article.location
                        ? {
                            location: {
                                label: 'Emplacement',
                                value: article.location
                            }
                        }
                        : {}),
                quantity: {
                    label: 'Quantité',
                    value: String(article.quantity),
                },
            },
            rightIcon: {
                name: 'trash.svg',
                color: 'danger',
                action: () => {
                    this.removeArticleFromSelected(index);
                }
            },
        }));
    }

    private removeArticleFromSelected(index: number): void {
        this.selectedArticles.splice(index, 1);
        this.headerConfig = this.createHeaderConfig();
        this.listConfig = this.createBodyConfig();
    }

}
