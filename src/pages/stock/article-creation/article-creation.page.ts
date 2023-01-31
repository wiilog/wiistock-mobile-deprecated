import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/common/services/api.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {TrackingListFactoryService} from '@app/common/services/tracking-list-factory.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/common/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {TranslationService} from '@app/common/services/translations.service';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';
import {Observable} from 'rxjs';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {IconConfig} from "@app/common/components/panel/model/icon-config";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelCalendarComponent
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {
    FormPanelCalendarMode
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode";
import {
    FormPanelTextareaComponent
} from "@app/common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";


@Component({
    selector: 'wii-prise',
    templateUrl: './article-creation.page.html',
    styleUrls: ['./article-creation.page.scss'],
})
export class ArticleCreationPage extends PageComponent implements CanLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean = false;
    public defaultLocation: string = '';
    public rfidTag: string = '';
    public headerConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
    };
    public creation: boolean = false;

    public reference: number;
    public supplier: number;

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.creation = false;
        this.bodyConfig = [];
        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService
                    .requestApi(ApiService.DEFAULT_LOCATION_ARTICLE_CREATION)
            }
        }).subscribe(({location}) => {
            if (location) {
                this.defaultLocation = location;
                this.headerConfig = {
                    leftIcon: {
                        name: 'transfer.svg',
                        color: 'tertiary'
                    },
                    title: `Balayer étiquette RFID`,
                    subtitle: `Emplacement : ${this.defaultLocation}`
                }
                this.loading = false;
            } else {
                this.toastService.presentToast('Aucun emplacement par défaut paramétré.');
            }
        })
    }

    public ionViewWillLeave(): void {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    wiiCanLeave(): boolean | Observable<boolean> {
        return true;
    }

    public scan(value) {
        this.loading = true;
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService
                    .requestApi(ApiService.GET_ARTICLE_BY_RFID_TAG, {
                        pathParams: {rfid: value},
                    })
            }
        }).subscribe(({article}) => {
            if (article) {
                this.toastService.presentToast('Article existant.');
                this.creation = false;
                this.bodyConfig = [];
            } else if (this.defaultLocation) {
                this.creation = true;
                this.rfidTag = value;
                this.initForm();
                console.log('Create');
            } else {
                this.toastService.presentToast('Aucun emplacement par défaut paramétré.');
            }
            this.loading = false;
        });
        console.log(value);
    }

    public initForm() {
        const values = this.formPanelComponent ? this.formPanelComponent.values : null;
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type',
                    value: values ? values.type : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.TYPE,
                        requestParams: [
                            `category = 'article'`,
                        ],
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Référence',
                    name: 'reference',
                    value: values ? values.reference : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.REFERENCE_ARTICLE,
                        onChange: (reference) => {
                            this.reference = reference;
                            if (this.supplier) {
                                this.cleanAndImportSupplierReferences();
                            }
                        }
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Fournisseur',
                    name: 'supplier',
                    value: values ? values.supplier : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.SUPPLIER,
                        onChange: (supplier) => {
                            this.supplier = supplier;
                            if (this.reference) {
                                this.cleanAndImportSupplierReferences();
                            }
                        }
                    },
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Référence fournisseur',
                    name: 'supplier_reference',
                    value: values ? values.supplier_reference : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.SUPPLIER_REFERENCE,
                        disabled: !this.supplier || !this.reference
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Libellé',
                    name: 'label',
                    inputConfig: {
                        type: 'text'
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Quantité',
                    name: 'quantity',
                    inputConfig: {
                        type: 'number'
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Prix unitaire',
                    name: 'price',
                    inputConfig: {
                        type: 'number'
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de péremption',
                    name: 'expiryDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Numéro de lot',
                    name: 'batch',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Zone de destination',
                    name: 'destination',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Numéro de commande',
                    name: 'commandNumber',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Ligne bon de livraison',
                    name: 'deliveryLine',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de fabrication',
                    name: 'buildDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE,
                    },
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Pays d\'origine',
                    name: 'country',
                    inputConfig: {
                        type: 'text',
                    },
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date de production',
                    name: 'productionDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATE,
                    },
                }
            },
            {
                item: FormPanelTextareaComponent,
                config: {
                    label: 'Commentaire',
                    name: 'comment',
                    inputConfig: {
                        type: 'text',
                        maxLength: '512',
                    },
                }
            },
        ]
    }

    public cleanAndImportSupplierReferences() {
        console.log(this.supplier, this.reference);
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.GET_SUPPLIER_REF_BY_REF_AND_SUPPLIER, {
                    pathParams: {
                        ref: this.reference,
                        supplier: this.supplier
                    }
                })
            }
        }).subscribe((response) => {
            this.sqliteService.importSupplierReferences(response.supplierReferences).subscribe(() => {
                this.initForm();
            });
        })
    }

    public rfid() {
        console.log('RFID')
    }

    public validate() {
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.CREATE_ARTICLE, {
                    params: Object.assign({
                        rfid: this.rfidTag
                    }, this.formPanelComponent.values)
                })
            }
        }).subscribe((response) => {
            this.toastService.presentToast(response.message).subscribe(() => {
                if (response.success) {
                    //this.navService.pop();
                }
            })
        })
    }

    public scanMatrix() {
        console.log('scanMatrix');
    }

}
