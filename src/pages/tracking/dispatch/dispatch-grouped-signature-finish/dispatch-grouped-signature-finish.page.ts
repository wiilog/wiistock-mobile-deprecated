import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {flatMap, map, mergeMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@app/common/components/select-item/select-item.component";
import {ToastService} from '@app/common/services/toast.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/common/services/translations.service';
import * as moment from 'moment';
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {IconColor} from "@app/common/components/icon/icon-color";
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {Emplacement} from "@entities/emplacement";
import {Status} from "@entities/status";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {ApiService} from "@app/common/services/api.service";

@Component({
    selector: 'wii-dispatch-grouped-signature-finish',
    templateUrl: './dispatch-grouped-signature-finish.page.html',
    styleUrls: ['./dispatch-grouped-signature-finish.page.scss'],
})
export class DispatchGroupedSignatureFinishPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public selectItemComponent: SelectItemComponent;

    private loadingSubscription: Subscription;

    public loading: boolean;
    public firstLaunch: boolean;

    public resetEmitter$: EventEmitter<void>;

    public labelFrom?: string;
    public labelTo?: string;
    public selectedStatus?: Status;
    public from?: {
        id: number,
        text: string
    };
    public to?: {
        id: number,
        text: string
    };
    public dispatchesToSignListConfig: Array<CardListConfig>;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public dispatchesToSign: Array<Dispatch>;
    public bodyConfig: Array<FormPanelParam>;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       private apiService: ApiService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.firstLaunch = true;
    }


    public ionViewWillEnter(): void {
        this.resetEmitter$.emit();
        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`).subscribe((translations: Translations) => {
            this.labelFrom = TranslationService.Translate(translations, 'Emplacement de prise');
            this.labelTo = TranslationService.Translate(translations, 'Emplacement de dépose');

            this.selectedStatus = this.currentNavParams.get('status');
            this.from = this.currentNavParams.get('from');
            this.to = this.currentNavParams.get('to');
            this.dispatchesToSign = this.currentNavParams.get('dispatches');
            this.dispatchesToSignListConfig = this.dispatchesToSign
                .map((dispatch: Dispatch) => {
                    console.log(dispatch);
                    return {
                        title: {label: 'Statut', value: dispatch.statusLabel},
                        customColor: dispatch.groupedSignatureStatusColor || dispatch.color,
                        content: [
                            {label: 'Numéro', value: dispatch.number || ''},
                            {label: 'Type', value: dispatch.typeLabel || ''},
                            {
                                label: this.labelFrom,
                                value: dispatch.locationFromLabel || ''
                            },
                            {
                                label: this.labelTo,
                                value: dispatch.locationToLabel || ''
                            },
                            {
                                label: 'Références (quantité)',
                                value: dispatch.quantities || ''
                            },
                        ].filter((item) => item && item.value),
                    };
                });

            this.bodyConfig = [
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Trigramme signataire',
                        name: 'signatoryTrigram',
                        value: '',
                        inputConfig: {
                            required: true,
                            type: 'text',
                            disabled: false
                        },
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Code signataire',
                        name: 'signatoryPassword',
                        value: '',
                        inputConfig: {
                            required: true,
                            type: 'password',
                            disabled: false
                        },
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        name: 'comment',
                        value: '',
                        inputConfig: {
                            required: Boolean(this.selectedStatus.commentNeeded),
                            type: 'text',
                            disabled: false
                        },
                    }
                },
            ];
        });
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public finishGroupedSignature(){
        const {signatoryTrigram, signatoryPassword, comment} = this.formPanelComponent.values;
        if(signatoryTrigram && signatoryPassword && (!Boolean(this.selectedStatus.commentNeeded) || comment)){
            this.loadingService.presentLoadingWhile({
                event: () => {
                    return this.sqliteService.update(
                        'dispatch',
                        [{
                            values: {
                                statusId: this.selectedStatus.id,
                                statusLabel: this.selectedStatus.label,
                                partial: this.selectedStatus.state === 'partial' ? 1 : 0
                            },
                            where: [`id IN (${this.dispatchesToSign.map((dispatch: Dispatch) => dispatch.id).join(',')})`],
                        }]
                    ).pipe(
                        mergeMap(() => this.apiService.requestApi(ApiService.FINISH_GROUPED_SIGNATURE, {
                            params: {
                                from: this.from ? this.from.id : null,
                                to: this.to ? this.to.id : null,
                                status: this.selectedStatus.id,
                                signatoryTrigram,
                                signatoryPassword,
                                comment,
                                dispatchesToSign: this.dispatchesToSign.map((dispatch: Dispatch) => dispatch.id).join(','),
                            }
                        }))
                    )
                }
            }).subscribe((response) => {
                this.toastService.presentToast(response.msg).subscribe(() => {
                    if(response.success){
                        this.navService.setRoot(NavPathEnum.MAIN_MENU);
                    }
                });
            });
        } else {
            if (!signatoryTrigram && !signatoryPassword) {
                this.toastService.presentToast('Veuillez saisir un trigramme signataire et un code signataire.');
            } else if (!signatoryTrigram) {
                this.toastService.presentToast('Veuillez saisir un trigramme signataire.');
            } else if (!signatoryPassword) {
                this.toastService.presentToast('Veuillez saisir un code signataire.');
            } else if (Boolean(this.selectedStatus.commentNeeded) && !comment) {
                this.toastService.presentToast('Veuillez saisir un commentaire.');
            }
        }
    }
}
