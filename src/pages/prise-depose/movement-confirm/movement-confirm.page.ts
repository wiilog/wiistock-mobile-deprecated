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
import {Nature} from '@entities/nature';
import {zip} from 'rxjs';
import {MovementConfirmType} from '@pages/prise-depose/movement-confirm/movement-confirm-type';
import {IconColor} from '@app/common/components/icon/icon-color';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {MouvementTraca} from '@entities/mouvement-traca';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

enum Page {
    EDIT,
    SUB_PACKS
}


@Component({
    selector: 'wii-movement-confirm',
    templateUrl: './movement-confirm.page.html',
    styleUrls: ['./movement-confirm.page.scss'],
})
export class MovementConfirmPage extends PageComponent {

    private static readonly PageIcon = {
        [MovementConfirmType.DROP]: {icon: 'download.svg', color: 'success' as IconColor},
        [MovementConfirmType.TACKING]: {icon: 'upload.svg', color: 'primary' as IconColor}
    }
    private static readonly PageTitle = {
        [MovementConfirmType.DROP]: 'Dépose',
        [MovementConfirmType.TACKING]: 'Prise'
    }

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;
    public subPacksConfig: Array<ListPanelItemConfig>;

    public readonly Page = Page;
    public currentPage: Page = Page.EDIT;

    private savedNatureId: string;
    private location: Emplacement;
    private validate: (values: {quantity: string; comment: string; signature: string; photo: string; natureId: number, freeFields: string, subPacks?: any}) => void;

    public isGroup: boolean;
    public subPacks: Array<MouvementTraca>;
    public natureIdToNature: { [natureId: string]: Nature };
    public natureTranslationLabel: string;
    public fromStock: boolean;
    public movementType: MovementConfirmType;

    public constructor(private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       navService: NavService) {
        super(navService);
        this.savedNatureId = null;
        this.subPacksConfig = [];
    }

    public ionViewWillEnter(): void {
        this.location = this.currentNavParams.get('location');
        this.validate = this.currentNavParams.get('validate');
        this.isGroup = this.currentNavParams.get('isGroup');
        this.subPacks = this.currentNavParams.get('subPacks');
        this.natureTranslationLabel = this.currentNavParams.get('natureTranslationLabel');
        this.movementType = this.currentNavParams.get('movementType');

        const barCode = this.currentNavParams.get('barCode');
        const fromStock = this.currentNavParams.get('fromStock');
        const {quantity, comment, signature, photo, natureId, freeFields: freeFieldsValuesStr} = this.currentNavParams.get('values');
        const freeFieldsValues = freeFieldsValuesStr ? JSON.parse(freeFieldsValuesStr) : {};
        const chosenIcon = MovementConfirmPage.PageIcon[this.movementType];
        const chosenTitle = MovementConfirmPage.PageTitle[this.movementType];

        this.headerConfig = {
            title: `${chosenTitle} de ${barCode}`,
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: chosenIcon.icon,
                color: chosenIcon.color
            }
        };

        zip(
            this.sqliteService.findAll('nature'),
            this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.TRACKING}'`])
        )
            .subscribe(([natures, freeFields]: [Array<Nature>, Array<FreeField>]) => {
                const needsToShowNatures = natures.filter(nature => nature.hide !== 1).length > 0;

                this.natureIdToNature = natures.reduce((acc, nature) => ({
                    ...acc,
                    [Number(nature.id)]: nature
                }), {})


                const selectedNature = (needsToShowNatures && natureId)
                    ? this.natureIdToNature[Number(natureId)]
                    : null;
                this.savedNatureId = selectedNature ? String(selectedNature.id) : null;
                this.bodyConfig = [];
                if (selectedNature) {
                    this.bodyConfig.push({
                        item: FormPanelInputComponent,
                        config: {
                            label: this.natureTranslationLabel,
                            name: 'natureId',
                            value: selectedNature.label,
                            inputConfig: {
                                type: 'text',
                                disabled: true
                            }
                        }
                    });
                }
                else if (needsToShowNatures) {
                    this.bodyConfig.push({
                        item: FormPanelSelectComponent,
                        config: {
                            label: this.natureTranslationLabel,
                            name: 'natureId',
                            value: natureId,
                            inputConfig: {
                                required: false,
                                searchType: SelectItemTypeEnum.TRACKING_NATURES,
                                filterItem: (nature: Nature) => (!nature.hide)
                            }
                        }
                    });
                }

                if (!fromStock && !this.isGroup) {
                    this.bodyConfig.push({
                        item: FormPanelInputComponent,
                        config: {
                            label: 'Quantité',
                            name: 'quantity',
                            value: quantity,
                            inputConfig: {
                                type: 'number',
                                min: 1
                            },
                            errors: {
                                required: 'La quantité est requise',
                                min: 'La quantité doit être supérieure à 1'
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
                    ...(freeFields
                        .map(({id, ...freeField}) => (
                            this.formPanelService.createConfigFromFreeField(
                                {id, ...freeField},
                                freeFieldsValues[id],
                                'freeFields',
                                'create'
                            )
                        ))
                        .filter(Boolean))
                ]);

                if (this.isGroup) {
                    this.subPacksConfig = this.calculateSubPacksListConfig();
                }
            });
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            let {quantity, comment, signature, photo, natureId, freeFields} = this.formPanelComponent.values;
            natureId = this.savedNatureId ? this.savedNatureId : natureId
            if (freeFields) {
                Object.keys(freeFields).forEach((freeFieldId) => {
                    let freeField = freeFields[freeFieldId];
                    if (Array.isArray(freeField)) {
                        if (freeField[0].id === "") {
                            freeField = null;
                        } else {
                            freeField = freeField.map(({id}) => id).join(',')
                        }
                    }
                    freeFields[freeFieldId] = freeField;
                });
            }
            this.validate({
                quantity,
                comment,
                signature,
                photo,
                natureId,
                freeFields: JSON.stringify(freeFields),
                subPacks: this.subPacks
            });
            this.navService.pop();
        }
    }

    public onPageClicked(page: Page) {
        if (this.currentPage !== page) {
            this.currentPage = page;
        }
    }

    private updateSubPacks(barCode: string, { quantity, comment, signature, natureId, photo, freeFields }) {
        const index = this.subPacks.findIndex(({ref_article}) => (ref_article === barCode));
        if (index > -1) {
            this.subPacks[index].quantity = quantity;
            this.subPacks[index].comment = comment;
            this.subPacks[index].signature = signature;
            this.subPacks[index].nature_id = natureId;
            this.subPacks[index].photo = photo;
            this.subPacks[index].freeFields = freeFields;
        }
    }

    private calculateSubPacksListConfig() {
        return this.subPacks.map(({nature_id, ref_article, quantity, comment, signature, photo, freeFields}): ListPanelItemConfig => ({
            color: this.natureIdToNature[nature_id] ? this.natureIdToNature[nature_id].color : undefined,
            infos: {
                code: {
                    label: 'Code',
                    value: ref_article,
                },
                quantity: {
                    label: 'Quantité',
                    value: `${quantity}`,
                },
                ...(this.natureIdToNature[nature_id]
                    ? {
                        nature: {
                            label: this.natureTranslationLabel,
                            value: this.natureIdToNature[nature_id].label
                        }
                    }
                    : {})
            }
        }));
    }
}
