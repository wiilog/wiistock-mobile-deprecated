import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {TranslationService} from "@app/common/services/translations.service";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelToggleComponent
} from "@app/common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component";
import {
    FormPanelTextareaComponent
} from "@app/common/components/panel/form-panel/form-panel-textarea/form-panel-textarea.component";
import {
    FormPanelCameraComponent
} from "@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {CardListColorEnum} from "@app/common/components/card-list/card-list-color.enum";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {ApiService} from "@app/common/services/api.service";
import {
    FormPanelButtonsComponent
} from "@app/common/components/panel/form-panel/form-panel-buttons/form-panel-buttons.component";
import {Reference} from "@entities/reference";
import {Dispatch} from "@entities/dispatch";
import {of, zip} from "rxjs";

@Component({
    selector: 'wii-dispatch-logistic-unit-reference-association',
    templateUrl: './dispatch-logistic-unit-reference-association.page.html',
    styleUrls: ['./dispatch-logistic-unit-reference-association.page.scss'],
})
export class DispatchLogisticUnitReferenceAssociationPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public formConfig: Array<FormPanelParam> | any;
    public headerConfig: HeaderConfig;

    public logisticUnit: string;
    public dispatch: Dispatch;
    public reference: Reference | any = {};
    public volume: number = undefined;
    public disableValidate: boolean = true;
    public disabledAddReference: boolean = true;
    public associatedDocumentTypeElements: string;

    public edit: boolean = false;
    public viewMode: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private translationService: TranslationService,
                       private apiService: ApiService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_ASSOCIATED_DOCUMENT_TYPE_ELEMENTS)
        }).subscribe((values) => {
            this.associatedDocumentTypeElements = values;
            this.reference = this.currentNavParams.get(`reference`) || {};
            this.edit = this.currentNavParams.get(`edit`) || false;
            this.viewMode = this.currentNavParams.get(`edit`) || false;
            this.logisticUnit = this.currentNavParams.get(`logisticUnit`);
            this.dispatch = this.currentNavParams.get(`dispatch`);
            this.getFormConfig();
            this.createHeaderConfig();
        });
    }

    private getFormConfig(values: any = {}) {
        const loader = this.viewMode ? this.apiService.requestApi(ApiService.GET_ASSOCIATED_REF, {
            pathParams: {
                pack: this.logisticUnit,
                dispatch: this.dispatch.id
            }
        }) : of([]);
        this.loadingService.presentLoadingWhile({
            event: () => {
                return loader;
            }
        }).subscribe((response) => {
            let data = Object.keys(values).length > 0 ? values : this.reference;
            if (response.reference) {
                data = response;
            }

            const {
                reference,
                quantity,
                outFormatEquipment,
                manufacturerCode,
                sealingNumber,
                serialNumber,
                batchNumber,
                width,
                height,
                length,
                volume,
                weight,
                adr,
                associatedDocumentTypes,
                comment,
                photos,
                exists,
            } = data;
            console.log(associatedDocumentTypes);
            if (this.viewMode) {
                if (length && width && height) {
                    this.preComputeVolume(length, width, height);
                } else if (volume) {
                    this.volume = volume;
                }
            }
            console.log(this.volume);
            this.formConfig = [
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Référence',
                        name: 'reference',
                        value: reference ? reference : null,
                        inputConfig: {
                            required: true,
                            type: 'text',
                            onChange: (value) => this.disabledAddReference = value == ``,
                            disabled: this.viewMode || this.edit,
                        },
                        errors: {
                            required: 'Vous devez renseigner une réference.'
                        },
                    },
                },
                ...(!this.edit ? [{
                    item: FormPanelButtonsComponent,
                    config: {
                        inputConfig: {
                            type: 'text',
                            disabled: this.disabledAddReference,
                            elements: [
                                {id: `searchRef`, label: `Rechercher`}
                            ],
                            onChange: () => this.getReference(),
                        },
                    }
                }] : [])
            ];
            if (Object.keys(values).length > 0 || Object.keys(this.reference).length > 0 || this.viewMode) {
                this.formConfig.push({
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Quantité',
                            name: 'quantity',
                            value: quantity || (this.reference && this.reference.quantity ? this.reference.quantity : null),
                            inputConfig: {
                                required: true,
                                type: 'number',
                                min: 1,
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner une quantité.'
                            }
                        }
                    },
                    {
                        item: FormPanelToggleComponent,
                        config: {
                            label: 'Matériel hors format',
                            name: 'outFormatEquipment',
                            value: outFormatEquipment ? Boolean(outFormatEquipment) : null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de série',
                            name: 'serialNumber',
                            value: serialNumber || null,
                            inputConfig: {
                                required: false,
                                type: 'text',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de lot',
                            name: 'batchNumber',
                            value: batchNumber || null,
                            inputConfig: {
                                required: true,
                                type: 'text',
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner un numéro de lot.'
                            }
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Numéro de plombage/scellé',
                            value: sealingNumber || null,
                            name: 'sealingNumber',
                            inputConfig: {
                                type: 'text',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelToggleComponent,
                        config: {
                            label: 'ADR',
                            name: 'adr',
                            value: adr ? Boolean(adr) : null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Code fabriquant',
                            name: 'manufacturerCode',
                            value: manufacturerCode || null,
                            inputConfig: {
                                required: true,
                                type: 'text',
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner un code fabriquant.'
                            }
                        }
                    },
                    ...(!exists ? [{
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Longueur (cm)',
                            name: 'length',
                            value: length ? Number(length) : null,
                            inputConfig: {
                                required: true,
                                type: 'number',
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner une longueur.'
                            }
                        }
                    },
                        {
                            item: FormPanelInputComponent,
                            config: {
                                label: 'Largeur (cm)',
                                name: 'width',
                                value: width ? Number(width) : null,
                                inputConfig: {
                                    required: true,
                                    type: 'number',
                                    disabled: this.viewMode
                                },
                                errors: {
                                    required: 'Vous devez renseigner une largeur.'
                                }
                            }
                        },
                        {
                            item: FormPanelInputComponent,
                            config: {
                                label: 'Hauteur (cm)',
                                name: 'height',
                                value: height ? Number(height) : null,
                                inputConfig: {
                                    required: true,
                                    type: 'number',
                                    disabled: this.viewMode
                                },
                                errors: {
                                    required: 'Vous devez renseigner une hauteur.'
                                }
                            }
                        },
                        ...(!this.viewMode ? [{
                            item: FormPanelButtonsComponent,
                            config: {
                                inputConfig: {
                                    type: 'text',
                                    disabled: this.viewMode,
                                    elements: [
                                        {id: `compute`, label: `Calculer volume`}
                                    ],
                                    onChange: () => this.computeVolumeField(),
                                },
                            }
                        }]: [])] : []),
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Volume (m3)',
                            name: 'volume',
                            value: this.volume || Number(volume),
                            inputConfig: {
                                type: 'number',
                                required: true,
                                disabled: true,
                            },
                            errors: {
                                required: ``
                            }
                        }
                    },
                    {
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Poids (kg)',
                            name: 'weight',
                            value: weight ? Number(weight) : null,
                            inputConfig: {
                                type: 'number',
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelSelectComponent,
                        config: {
                            label: 'Types de documents associés',
                            name: 'associatedDocumentTypes',
                            value: associatedDocumentTypes
                                ? (Array.isArray(associatedDocumentTypes) ? associatedDocumentTypes : associatedDocumentTypes.split(`,`))
                                    .map((label) => ({
                                        id: label,
                                        label
                                    }))
                                : null,
                            inputConfig: {
                                required: true,
                                elements: this.associatedDocumentTypeElements.split(`,`).map((label) => ({
                                    id: label,
                                    label
                                })),
                                isMultiple: true,
                                disabled: this.viewMode
                            },
                            errors: {
                                required: 'Vous devez renseigner au moins un type de document associé.'
                            }
                        }
                    },
                    {
                        item: FormPanelTextareaComponent,
                        config: {
                            label: 'Commentaire',
                            name: 'comment',
                            value: comment || null,
                            inputConfig: {
                                disabled: this.viewMode
                            },
                        }
                    },
                    {
                        item: FormPanelCameraComponent,
                        config: {
                            label: 'Photo(s)',
                            name: 'photos',
                            value: photos ? JSON.parse(photos) : null,
                            inputConfig: {
                                multiple: true,
                                disabled: this.viewMode
                            }
                        }
                    });
            }


        })
    }

    private createHeaderConfig(): any {
        this.headerConfig = {
            transparent: true,
            leftIcon: {
                name: 'scanned-pack.svg',
                color: CardListColorEnum.PURPLE
            },
            title: `Unité logistique`,
            subtitle: this.logisticUnit
        };
    }

    public validate(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        } else {
            const reference = Object.keys(this.formPanelComponent.values).reduce((acc, key) => {
                if (this.formPanelComponent.values[key] !== undefined) {
                    acc[key] = this.formPanelComponent.values[key];
                }

                return acc;
            }, {} as Reference);
            if (!this.reference.exists && !reference.volume) {
                this.toastService.presentToast(`Le calcul du volume est nécessaire pour valider l'ajout de la référence.`)
            } else {
                reference.logisticUnit = this.logisticUnit;
                console.log(reference.volume);
                this.loadingService.presentLoadingWhile({
                    event: () => zip(
                        this.sqliteService.insert(`dispatch_pack`, {
                            code: this.logisticUnit,
                            quantity: reference.quantity,
                            dispatchId: this.dispatch.id,
                            treated: 1,
                            reference: reference.reference
                        }),
                        this.edit
                            ? this.sqliteService.update(`reference`, [{
                                values: {reference},
                                where: [`reference = '${reference.reference}'`]
                            }
                            ]) : this.sqliteService.insert(`reference`, reference)
                    )
                }).subscribe(() => {
                    this.navService.pop();
                });
            }
        }
    }

    public getReference() {
        const {reference} = this.formPanelComponent.values;
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_REFERENCE, {params: {reference}}),
            message: `Récupération des informations de la référence en cours...`
        }).subscribe(({reference}) => {
            this.disableValidate = false;
            this.reference = reference;
            this.getFormConfig();
        });
    }

    private computeVolumeField(): void {
        const values = this.formPanelComponent.values;
        const {length, width, height} = values;

        if (length && width && height) {
            this.preComputeVolume(length, width, height);
            this.getFormConfig(values);
        } else {
            this.toastService.presentToast(`Veuillez renseigner des valeurs valides pour le calcul du volume.`);
        }
    }

    private preComputeVolume(length: number, width: number, height: number) {
        const volumeCentimeters = length * width * height;
        const volumeMeters = volumeCentimeters / Math.pow(10, 6);
        this.volume = volumeMeters ? Number(volumeMeters.toFixed(6)) : undefined;
    }
}
