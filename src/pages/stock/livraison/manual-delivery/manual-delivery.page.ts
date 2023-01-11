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
import {ViewWillEnter, ViewWillLeave} from "@ionic/angular";
import {LocalDataManagerService} from "@app/common/services/local-data-manager.service";
import {of, pipe, zip} from "rxjs";
import {LoadingService} from "@app/common/services/loading.service";
import {AlertService} from "@app/common/services/alert.service";
import {
    FormPanelCalendarComponent
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {
    FormPanelCalendarMode
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode";
import {mergeMap} from "rxjs/operators";


@Component({
    selector: 'wii-manual-delivery',
    templateUrl: './manual-delivery.page.html',
    styleUrls: ['./manual-delivery.page.scss'],
})
export class ManualDeliveryPage extends PageComponent implements ViewWillEnter, ViewWillLeave {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private selectedArticles: Array<{
        id: number;
        barCode: string;
        label: string;
        reference: string;
        typeQuantity: string;
        location: string;
        quantity: number;
        is_lu: boolean;
        natureCode?: string;
        natureColor?: string;
        articles?: string;
        lastTrackingDate?: string;
        project?: string;
        articlesCount?: number;
    }> = [];

    public listBoldValues?: Array<string>;
    public headerConfig?: HeaderConfig;
    public listConfig?: ListPanelItemConfig[];
    public formConfig: Array<FormPanelParam>;

    private fieldParams: {
        displayProject: boolean,
        needsProject: boolean,
        displayExpectedAt: boolean,
        needsExpectedAt: boolean
    } = {
        displayProject: false,
        needsProject: false,
        displayExpectedAt: false,
        needsExpectedAt: false
    };

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       private localDataManagerService: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private alertService: AlertService,
                       navService: NavService) {
        super(navService);
    }

    public ngOnInit() {
        this.listBoldValues = ['reference', 'label', 'barCode', 'location', 'quantity', 'lastTrackingDate', 'nature'];

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        this.headerConfig = this.createHeaderConfig();
        this.listConfig = this.createBodyConfig();

        zip(
            this.storageService.getNumber('demande.project.displayedCreate'),
            this.storageService.getNumber('demande.project.requiredCreate'),
            this.storageService.getNumber('demande.expectedAt.displayedCreate'),
            this.storageService.getNumber('demande.expectedAt.requiredCreate'),
        ).subscribe((values) => {
            values.forEach((value, index) => {
                this.fieldParams[Object.keys(this.fieldParams)[index]] = value;
            });

            this.getFormConfig();
        });
    }

    public getFormConfig(logisticUnitProject: any = undefined): void {
        const {type, comment, expectedAt, project} = this.formPanelComponent
            ? this.formPanelComponent.values
            : {type: null, comment: null, expectedAt: null, project: null};

        this.formConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: type,
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
                    value: comment,
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
        ];

        if(this.fieldParams.displayProject) {
            this.formConfig.push({
                item: FormPanelSelectComponent,
                config: {
                    label: 'Projet',
                    name: 'project',
                    value: Number(logisticUnitProject) || project,
                    inputConfig: {
                        required: this.fieldParams.needsProject,
                        searchType: SelectItemTypeEnum.PROJECT,
                        label: `code`,
                        disabled: !!logisticUnitProject
                    },
                    ...(this.fieldParams.needsProject
                        ? ({
                            errors: {
                                required: 'Vous devez sélectionner un projet'
                            }
                        })
                        : {})
                }
            });
        }

        if(this.fieldParams.displayExpectedAt) {
            this.formConfig.push({
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date attendue',
                    name: 'expectedAt',
                    value: expectedAt,
                    inputConfig: {
                        required: this.fieldParams.needsExpectedAt,
                        mode: FormPanelCalendarMode.DATE
                    },
                    ...(this.fieldParams.needsExpectedAt
                        ? ({
                            errors: {
                                required: 'Vous devez renseigner une date attendue'
                            }
                        })
                        : {})
                }
            });
        }
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public addArticle(article: string) {
        const params = {
            barCode: article,
        };

        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_ARTICLES, {params}).pipe(
                mergeMap((response: any) => zip(
                        of(response),
                        this.sqliteService.findOneBy(`project`, {code: response.article.project})
                    )
                )
            )
        }).subscribe(([response, project]) => {
            if (response.success) {
                if (response.article && !response.article.is_ref) {
                    const existing = this.selectedArticles.find(article => article.barCode == response.article.barCode)
                    if (existing) {
                        this.toastService.presentToast(`Vous avez déjà scanné cet ${response.article.is_lu ? 'unité logistique' : 'article'}.`);
                    } else {
                        const processArticleTaking = () => {
                            this.selectedArticles.push(response.article);

                            this.headerConfig = this.createHeaderConfig();
                            this.listConfig = this.createBodyConfig();

                            if (project && project.id) {
                                this.getFormConfig(project.id);
                            }
                        }

                        const values = this.formPanelComponent.values;
                        if (response.article.is_lu && project && values.project && values.project != project.id) {
                            this.toastService.presentToast(`Vous ne pouvez pas scanner une unité logistique avec un projet différent de celui sélectionné.`);
                        } else if (response.article.currentLogisticUnitId) {
                            this.alertService.show({
                                message: `L'article ${response.article.barCode} sera enlevé de l'unité logistique ${response.article.currentLogisticUnitCode}`,
                                buttons: [{
                                    text: 'Annuler',
                                    role: 'cancel',
                                }, {
                                    text: 'Confirmer',
                                    cssClass: 'alert-success',
                                    handler: () => processArticleTaking()
                                }]
                            });
                        } else {
                            processArticleTaking();
                        }
                    }
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
            const {type, comment, expectedAt, project} = this.formPanelComponent.values;

            this.navService.push(NavPathEnum.MANUAL_DELIVERY_LOCATION, {
                livraison: {
                    type,
                    comment,
                    expectedAt,
                    project,
                    articles: this.selectedArticles,
                }
            });
        }
    }

    private createHeaderConfig(): HeaderConfig {
        const articlesCount = this.selectedArticles.filter((article) => !article.is_lu).length;
        const logisticUnitsCount = this.selectedArticles.length - articlesCount;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} scanné${articlesCount > 1 ? 's' : ''}`,
            `${logisticUnitsCount} UL scannée${logisticUnitsCount > 1 ? 's' : ''}`
        ];

        return {
            title: 'Livré',
            info: `${content.join(`, `)}`,
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
                ...(!article.is_lu ? {
                    reference: {
                        label: 'Référence article',
                        value: article.reference
                    },
                    label: {
                        label: 'Libellé',
                        value: article.label
                    },
                } : {}),
                barCode: {
                    label: article.is_lu ? 'Objet' : 'Code barre',
                    value: article.barCode
                },
                ...(article.is_lu && article.lastTrackingDate ? ({
                    lastTrackingDate: {
                        label: 'Date/Heure',
                        value: article.lastTrackingDate
                    }
                }) : {}),
                ...(!article.is_lu && article.location
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: article.location
                        }
                    }
                    : {}),
                quantity: {
                    label: article.is_lu ? `Nombre d'articles` : `Quantité`,
                    value: `${article.articlesCount || 0}`,
                },
                ...(article.is_lu && article.natureCode ? {
                    nature: {
                        label: 'Nature',
                        value: article.natureCode
                    }
                } : {}),
            },
            rightIcon: {
                name: 'trash.svg',
                color: 'danger',
                action: () => {
                    this.removeArticleFromSelected(index);
                }
            },
            ...(article.is_lu ? {
                pressAction: () => this.showLogisticUnitContent(article.articles, article.barCode),
            } : {}),
            ...(article.is_lu && article.natureColor ? ({
                color: article.natureColor
            }) : {})
        }));
    }

    private removeArticleFromSelected(index: number): void {
        this.selectedArticles.splice(index, 1);
        this.headerConfig = this.createHeaderConfig();
        this.listConfig = this.createBodyConfig();

        const logisticUnitsWithProject = this.selectedArticles.filter((article) => article.project);
        if(logisticUnitsWithProject.length === 0) {
            this.getFormConfig();
        }
    }

    private showLogisticUnitContent(articles: string, logisticUnit: string): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_ARTICLES, {params: {barcodes: articles}})
        }).subscribe(({articles}) => {
            const options = {
                articles,
                logisticUnit,
            };
            this.navService.push(NavPathEnum.DELIVERY_LOGISTIC_UNIT_CONTENT, options);
        });
    }
}
