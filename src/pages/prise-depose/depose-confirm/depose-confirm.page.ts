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
    selector: 'wii-depose-confirm',
    templateUrl: './depose-confirm.page.html',
    styleUrls: ['./depose-confirm.page.scss'],
})
export class DeposeConfirmPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;

    private location: Emplacement;
    private validateDepose: (values: {comment: string; signature: string; photo: string; natureId: number, freeFields: string}) => void;

    public constructor(private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.location = this.currentNavParams.get('location');
        this.validateDepose = this.currentNavParams.get('validateDepose');

        const barCode = this.currentNavParams.get('barCode');
        const {comment, signature, photo, natureId, freeFields: freeFieldsValuesStr} = this.currentNavParams.get('values');
        const freeFieldsValues = freeFieldsValuesStr ? JSON.parse(freeFieldsValuesStr) : {};

        this.headerConfig = {
            title: `DEPOSE de ${barCode}`,
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: 'download.svg',
                color: 'success'
            }
        };

        this.sqliteService
            .findBy('free_field', [`type = '${FreeFieldType.TRACKING}'`])
            .subscribe((freeFields: Array<FreeField>) => {
                this.bodyConfig = [
                    {
                        item: FormPanelSelectComponent,
                        config: {
                            label: 'Type',
                            name: 'natureId',
                            value: natureId,
                            inputConfig: {
                                required: true,
                                searchType: SelectItemTypeEnum.TRACKING_NATURES,
                                requestParams: ['hide <> 1']
                            },
                            errors: {
                                required: 'Vous devez sélectionner une nature'
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
                ];
            });
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            console.log(this.formPanelComponent.values)
            const {comment, signature, photo, natureId, freeFields} = this.formPanelComponent.values;
            this.validateDepose({
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
