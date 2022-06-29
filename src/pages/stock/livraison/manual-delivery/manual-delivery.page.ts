import {Component, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ArticleLivraison} from '@entities/article-livraison';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ApiService} from '@app/common/services/api.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {flatMap} from 'rxjs/operators';
import * as moment from 'moment';
import {Mouvement} from '@entities/mouvement';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {NetworkService} from '@app/common/services/network.service';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {zip} from "rxjs";
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelTextareaComponent} from '@app/common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';
import {DemandeLivraison} from '@entities/demande-livraison';
import {FreeField, FreeFieldType} from '@entities/free-field';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {Emplacement} from '@entities/emplacement';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';


@Component({
    selector: 'wii-manual-delivery',
    templateUrl: './manual-delivery.page.html',
    styleUrls: ['./manual-delivery.page.scss'],
})
export class ManualDeliveryPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public livraison: Livraison;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;
    public readonly scannerType: SelectItemTypeEnum = SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES;

    private availableArticles: Array<DemandeLivraisonArticle>;
    private selectedArticles: Array<DemandeLivraisonArticle>;

    public listBoldValues?: Array<string>;
    public headerConfig?: HeaderConfig;
    public listConfig?: ListPanelItemConfig[];

    public formConfig: Array<FormPanelParam>;

    public pageAlreadyInit: boolean = false;
    public loading: boolean = false;
    public started: boolean = false;
    public skipValidation: boolean = false;
    public skipQuantities: boolean = false;
    public loadingStartLivraison: boolean;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.loadingStartLivraison = false;
    }

    public ionViewWillEnter(): void {
        this.listBoldValues = ['reference', 'label', 'barCode', 'location', 'quantity'];

        if (!this.pageAlreadyInit) {
            this.selectedArticles = [];
            this.pageAlreadyInit = true;
            this.loading = true;
            this.sqliteService.findArticlesNotInDemandeLivraison().subscribe((availableArticles: Array<DemandeLivraisonArticle>) => {
                this.availableArticles = availableArticles;
                this.headerConfig = this.createHeaderConfig(0);
                this.listConfig = this.createBodyConfig([]);
                this.loading = false;
            });
        }

        this.formConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: null,
                    inputConfig: {
                        required: true,
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
                    label: `Commentaire`,
                    name: 'comment',
                    value: '',
                    inputConfig: {
                        required: false,
                        maxLength: '512',
                    },
                }
            },
        ];
    }

    public addArticle(article: string) {
        const index = this.availableArticles.findIndex(({reference}) => reference === article);
        if (index !== -1) {
            this.selectedArticles.push(this.availableArticles[index]);

            this.headerConfig = this.createHeaderConfig(this.selectedArticles.length);
            this.listConfig = this.createBodyConfig(this.selectedArticles);
        }
    }

    public validate(): void {
        const error = this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        } else {
            let {type, comment} = this.formPanelComponent.values;

            //TODO 7544: rediriger vers la bonne page !!
            this.navService.push(`todo` as any, {
                type,
                comment,
                articles: this.selectedArticles,
            });
        }
    }

    private createHeaderConfig(articles: number): HeaderConfig {
        const articlesPlural = articles > 1 ? 's' : '';
        return {
            title: 'Livré',
            info: `${articles} article${articlesPlural} scanné${articlesPlural}`,
            leftIcon: {
                name: 'upload.svg',
                color: 'list-yellow-light'
            },
            rightIconLayout: 'horizontal',
            rightIcon: [
                {
                    color: 'primary',
                    name: 'scan-photo.svg',
                },
            ],
        };
    }

    private createBodyConfig(articles: Array<DemandeLivraisonArticle>): Array<ListPanelItemConfig> {
        return articles.map((article: DemandeLivraisonArticle, index: number) => ({
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
                    value: article.bar_code
                },
                ...(
                    article.location_label
                        ? {
                            location: {
                                label: 'Emplacement',
                                value: article.location_label
                            }
                        }
                        : {}),
                quantity: {
                    label: 'Quantité',
                    value: String(article.available_quantity),
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
        this.headerConfig = this.createHeaderConfig(this.selectedArticles.length);
        this.listConfig = this.createBodyConfig(this.selectedArticles);
    }

}
