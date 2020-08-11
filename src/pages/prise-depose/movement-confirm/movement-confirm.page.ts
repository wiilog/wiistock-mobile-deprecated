import {Component, ViewChild} from '@angular/core';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {Emplacement} from '@entities/emplacement';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {ActivatedRoute} from '@angular/router';
import {PageComponent} from '@pages/page.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FreeField, FreeFieldType} from '@entities/free-field';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {FormPanelService} from '@app/common/services/form-panel.service';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelSigningComponent} from '@app/common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelCameraComponent} from '@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';


@Component({
    selector: 'wii-movement-confirm',
    templateUrl: './movement-confirm.page.html',
    styleUrls: ['./movement-confirm.page.scss'],
})
export class MovementConfirmPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    private savedNatureId: string;
    private location: Emplacement;
    private validate: (values: {comment: string; signature: string; photo: string; natureId: number, freeFields: string}) => void;

    public constructor(private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       navService: NavService) {
        super(navService);
        this.savedNatureId = null;
    }

    public ionViewWillEnter(): void {
        this.location = this.currentNavParams.get('location');
        this.validate = this.currentNavParams.get('validate');

        const barCode = this.currentNavParams.get('barCode');
        const movementType = this.currentNavParams.get('movementType');
        const natureTranslationLabel = this.currentNavParams.get('natureTranslationLabel');
        const {comment, signature, photo, natureId, freeFields: freeFieldsValuesStr} = this.currentNavParams.get('values');
        const freeFieldsValues = freeFieldsValuesStr ? JSON.parse(freeFieldsValuesStr) : {};

        this.headerConfig = {
            title: `${movementType} de ${barCode}`,
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: 'download.svg',
                color: 'success'
            }
        };

       this.sqliteService.findAll('nature').subscribe((natures) => {
           const needsToShowNatures = natures.filter(nature => nature.hide !== 1).length > 0;
           const selectedNature = needsToShowNatures && natureId
               ? natures.find((nature) => ((Number.isInteger(nature.id)
                   ? nature.id.toString()
                   : nature.id)  === natureId.toString()))
               : null;
           this.savedNatureId = selectedNature ? selectedNature.id : null;
            this.sqliteService
                .findBy('free_field', [`type = '${FreeFieldType.TRACKING}'`])
                .subscribe((freeFields: Array<FreeField>) => {
                    this.bodyConfig = [];
                    if (selectedNature) {
                        this.bodyConfig.push({
                            item: FormPanelInputComponent,
                            config: {
                                label: natureTranslationLabel,
                                name: 'natureId',
                                value: selectedNature.label,
                                inputConfig: {
                                    type: 'text',
                                    disabled: true
                                }
                            }
                        });
                    } else if (needsToShowNatures) {
                        this.bodyConfig.push({
                            item: FormPanelSelectComponent,
                            config: {
                                label: natureTranslationLabel,
                                name: 'natureId',
                                value: natureId,
                                inputConfig: {
                                    required: false,
                                    searchType: SelectItemTypeEnum.TRACKING_NATURES,
                                    requestParams: ['hide <> 1']
                                }
                            }
                        });
                    }
                    this.bodyConfig = this.bodyConfig.concat([
                        {
                            item: FormPanelInputComponent,
                            config: {
                                label: 'Commentaire',
                                name: 'comment',
                                value: comment,
                                inputConfig: {
                                    type: 'text',
                                    maxLength: '255'
                                },
                                errors: {
                                    required: 'Votre commentaire est requis',
                                    maxlength: 'Votre commentaire est trop long'
                                }
                            }
                        },
                        {
                            item: FormPanelSigningComponent,
                            config: {
                                label: 'Signature',
                                name: 'signature',
                                value: signature,
                                inputConfig: {}
                            }
                        },
                        {
                            item: FormPanelCameraComponent,
                            config: {
                                label: 'Photo',
                                name: 'photo',
                                value: photo,
                                inputConfig: {}
                            }
                        },
                        ...freeFields
                            .map(({id, ...freeField}) => (
                                this.formPanelService.createFromFreeField(
                                    {id, ...freeField},
                                    freeFieldsValues[id],
                                    'freeFields'
                                )
                            ))
                            .filter(Boolean)
                    ]);
                });
        })
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            let {comment, signature, photo, natureId, freeFields} = this.formPanelComponent.values;
            natureId = this.savedNatureId ? this.savedNatureId : natureId
            Object.keys(freeFields).forEach((freeFieldId) => {
                let freeField = freeFields[freeFieldId];
                if (Array.isArray(freeField)) {
                    if (freeField[0].id === "") {
                        freeField = null;
                    } else {
                        freeField = freeField.map(ff => ff.id).join(',')
                    }
                }
                freeFields[freeFieldId] = freeField;
            });
            this.validate({
                comment,
                signature,
                photo,
                natureId,
                freeFields: JSON.stringify(freeFields)
            });
            this.navService.pop();
        }
    }
}
