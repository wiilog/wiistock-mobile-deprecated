import {Component, ViewChild} from '@angular/core';
import {of, Subscription, zip} from 'rxjs';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {StorageService} from '@app/common/services/storage/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {NavService} from '@app/common/services/nav.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {ToastService} from '@app/common/services/toast.service';
import {flatMap, map, tap} from 'rxjs/operators';
import {PageComponent} from '@pages/page.component';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelService} from "@app/common/services/form-panel.service";
import {FreeField, FreeFieldType} from "@entities/free-field";
import {LoadingService} from '@app/common/services/loading.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-demande-livraison-header',
    templateUrl: './demande-livraison-header.page.html',
    styleUrls: ['./demande-livraison-header.page.scss'],
})
export class DemandeLivraisonHeaderPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public hasLoaded: boolean;

    public formBodyConfig: Array<FormPanelParam>;

    private isUpdate: boolean;
    private demandeLivraisonToUpdate?: DemandeLivraison;

    private operatorId: number;

    private validationSubscription: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private mainHeaderService: MainHeaderService,
                       private storageService: StorageService,
                       private formPanelService: FormPanelService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
        this.hasLoaded = false;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;

        const demandeId = this.currentNavParams.get('demandeId');
        this.isUpdate = this.currentNavParams.get('isUpdate');

        this.formPanelComponent.fireZebraScan();

        zip(
            this.storageService.getOperatorId(),
            this.isUpdate ? this.sqliteService.findOneById('demande_livraison', demandeId) : of(this.demandeLivraisonToUpdate),
            this.storageService.getOperator(),
            this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.DELIVERY_REQUEST}'`])
        )
        .subscribe(([operatorId, demandeLivraison, operator, freeFields]: [number, DemandeLivraison|undefined, string, Array<FreeField>]) => {
            this.demandeLivraisonToUpdate = demandeLivraison;
            this.operatorId = operatorId;

            this.createFormBodyConfig(operator, freeFields);

            this.hasLoaded = true;
        });
    }

    public ionViewWillLeave(): void {
        this.formPanelComponent.unsubscribeZebraScan();
    }

    public createFormBodyConfig(operator: string, freeFields: Array<FreeField>, typeId?: number) {
        const {location_id: location, comment, free_fields} = (this.demandeLivraisonToUpdate || {});
        const type = typeId
            ? typeId
            : (this.demandeLivraisonToUpdate
                ? this.demandeLivraisonToUpdate.type_id
                : undefined);

        const freeFieldsValues = JSON.parse(free_fields || '{}') || {};

        this.formBodyConfig = [
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Demandeur',
                    name: 'requester',
                    value: operator,
                    inputConfig: {
                        type: 'text',
                        disabled: true
                    }
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Type',
                    name: 'type_id',
                    value: type,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE,
                        requestParams: ['to_delete IS NULL'],
                        onChange: (typeId) => {
                            this.createFormBodyConfig(operator, freeFields, Number(typeId))
                        }
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
                        maxLength: '255'
                    },
                    errors: {
                        maxlength: 'Votre commentaire est trop long'
                    }
                }
            },
            ...(freeFields
                .filter(({typeId}) => (typeId === type))
                .map(({id, ...freeField}) => (
                    this.formPanelService.createConfigFromFreeField(
                        {id, ...freeField},
                        freeFieldsValues[id],
                        'free_fields',
                        'create'
                    )
                ))
                .filter(Boolean)),
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Destination',
                    name: 'location_id',
                    value: location,
                    inputConfig: {
                        required: true,
                        barcodeScanner: true,
                        searchType: SelectItemTypeEnum.LOCATION
                    },
                    errors: {
                        required: 'Vous devez sélectionner une destination'
                    }
                }
            }
        ];
    }

    public onFormSubmit(): void {
        const error = this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        }
        else {
            let {type_id, location_id, comment, free_fields} = this.formPanelComponent.values;
            free_fields = JSON.stringify(free_fields || {});

            const user_id = this.operatorId;
            const values = {type_id, location_id, comment, user_id, free_fields};

            if (!this.validationSubscription) {
                let loader: HTMLIonLoadingElement;
                this.validationSubscription = this.loadingService.presentLoading()
                    .pipe(
                        tap((loadingElement) => {
                            loader = loadingElement;
                        }),
                        flatMap(() => (
                            this.isUpdate
                                ? this.sqliteService
                                    .update('demande_livraison', [{values, where: [`id = ${this.demandeLivraisonToUpdate.id}`]}])
                                    .pipe(map(() => this.demandeLivraisonToUpdate.id))
                                : this.sqliteService.insert('demande_livraison', values)
                        ))
                    )
                    .subscribe(
                        (insertId) => {
                            this.demandeLivraisonToUpdate = {
                                id: insertId,
                                ...values
                            };
                            this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_ARTICLES, {
                                demandeId: insertId,
                                isUpdate: this.isUpdate
                            });

                            this.unsubscribeValidate(loader);
                        },
                        () => {
                            this.unsubscribeValidate(loader);
                        }
                    );
            }
            else {
                this.toastService.presentToast('Sauvegarde du brouillon en cours...');
            }
        }
    }

    private unsubscribeValidate(loader: HTMLIonLoadingElement): void {
        if (loader) {
            loader.dismiss();
        }

        if (this.validationSubscription) {
            this.validationSubscription.unsubscribe();
            this.validationSubscription = undefined;
        }
    }
}
