import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {ToastService} from "@app/common/services/toast.service";
import {StorageService} from "@app/common/services/storage/storage.service";
import {Emplacement} from "@entities/emplacement";
import {ApiService} from "@app/common/services/api.service";
import {LoadingService} from "@app/common/services/loading.service";
import {MainHeaderService} from "@app/common/services/main-header.service";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {AlertService} from "@app/common/services/alert.service";
import {
    FormPanelToggleComponent
} from "@app/common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component";
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {
    FormPanelSigningComponent
} from "@app/common/components/panel/form-panel/form-panel-signing/form-panel-signing.component";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {Carrier} from "@entities/carrier";

@Component({
    selector: 'wii-truck-arrival-reserves',
    templateUrl: './truck-arrival-reserves.page.html',
    styleUrls: ['./truck-arrival-reserves.page.scss'],
})
export class TruckArrivalReservesPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public loading: boolean;

    public truckArrivalUnloadingLocation: Emplacement;

    public driver: { id?: number; label?: string; prenom?: string; id_transporteur?: number } = {};

    public carrier: Carrier;

    public registrationNumber?: string;

    public truckArrivalReservesListConfig: Array<FormPanelParam> | any;

    public signatures?: Array<string>;

    public reserves?: Array<{
       type: string;
       quantity?: number;
       quantityType?: string;
       comment?: string;
    }> = [];

    public truckArrivalLines?: Array<{
        number?: string;
        reserve?: {
            type?: string;
            comment?: string;
            photos?: Array<string>;
        }
    }> = [];

    public constructor(navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public storageService: StorageService,
                       public toastService: ToastService,
                       public alertService: AlertService,
                       private mainHeaderService: MainHeaderService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.mainHeaderService.emitSubTitle('Etape 4/4');
        if(this.truckArrivalLines.length === 0){
            this.loading = false;
            this.carrier = this.currentNavParams.get('carrier') ?? [];
            this.driver = this.currentNavParams.get('driver') ?? {};
            this.truckArrivalUnloadingLocation = this.currentNavParams.get('truckArrivalUnloadingLocation') ?? [];
            this.registrationNumber = this.currentNavParams.get('registrationNumber') ?? null;
            this.truckArrivalLines = this.currentNavParams.get('truckArrivalLines') ?? [];

            this.refreshFormReserves(false, false);
        }
    }

    public refreshFormReserves(generalReserveChecked?: boolean, quantityReserveChecked?: boolean, options: { quantity?: number; quantityType?: string; comment?: string; } = {}, quantityParamsBefore?: string){
        const {generalComment, quantityComment, signatures} = this.formPanelComponent.values;
        const quantityParams = quantityParamsBefore || (options && options.quantity && options.quantityType
            ? (': ' + options.quantity + ' UL en ' + (options.quantityType === 'minus' ? 'moins' : 'plus'))
            : '');
        this.truckArrivalReservesListConfig = [
            {
                item: FormPanelToggleComponent,
                config: {
                    label: 'Réserve',
                    name: 'generalReserve',
                    value: generalReserveChecked,
                    inputConfig: {
                        onChange: (value) => {
                            this.refreshFormReserves(value, quantityReserveChecked, {}, quantityParams);
                        }
                    },
                    section: {
                        title: 'Réserve générale',
                        bold: true,
                    }
                },
                multiple: false
            },
            ...(generalReserveChecked
                ? [{
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        value: generalComment || '',
                        name: 'generalComment',
                        inputConfig: {
                            type: 'text',
                            required: true,
                        },
                        errors: {
                            required: 'Le champ commentaire est obligatoire pour valider votre arrivage camion.'
                        },
                    }
                }]
                : []),
            {
                item: FormPanelToggleComponent,
                config: {
                    label: 'Réserve ' + quantityParams,
                    name: 'quantityReserve',
                    value: quantityReserveChecked,
                    inputConfig: {
                        onChange: (value) => {
                            if(value){
                                this.navService.push(NavPathEnum.TRUCK_ARRIVAL_RESERVE_DETAILS, {
                                    type: 'quantity',
                                    afterValidate: (data) => {
                                        this.reserves.push({
                                            type: 'quantity',
                                            quantity: data.quantity || 1,
                                            quantityType: data.quantityType || 'minus',
                                            comment: data.comment || '',
                                        });
                                        this.refreshFormReserves(generalReserveChecked, value, {
                                            quantity: data.quantity || 1,
                                            quantityType: data.quantityType || 'minus',
                                            comment: data.comment || '',
                                        });
                                    }
                                });
                            } else {
                                this.refreshFormReserves(generalReserveChecked, value);
                            }
                        }
                    },
                    section: {
                        title: 'Réserve quantité +/-',
                        bold: true,
                    }
                },
            },
            ...(quantityReserveChecked && ((options && options.comment || quantityComment))
                ? [{
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        value: options.comment || quantityComment || '',
                        name: 'quantityComment',
                        inputConfig: {
                            type: 'text',
                        },
                    }
                }]
                : []),
            {
                item: FormPanelSigningComponent,
                config: {
                    label: 'Signature(s)',
                    name: 'signatures',
                    value: signatures,
                    inputConfig: {
                        multiple: true,
                        max: 2,
                    }
                }
            }
        ];
    }
    public validate() {
        const firstError = this.formPanelComponent.firstError;
        if(firstError){
            this.toastService.presentToast(firstError);
        } else {
            const {generalComment, signatures} = this.formPanelComponent.values;
            if (generalComment) {
                this.reserves.push({
                    type: 'general',
                    comment: generalComment,
                });
            }


            this.loadingService.presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.FINISH_TRUCK_ARRIVAL, {
                    params: {
                        carrierId: this.carrier.id,
                        driverId: this.driver.id || null,
                        registrationNumber: this.registrationNumber,
                        truckArrivalUnloadingLocationId: this.truckArrivalUnloadingLocation.id,
                        truckArrivalReserves: this.reserves,
                        truckArrivalLines: this.truckArrivalLines,
                        signatures,
                    }
                })
            }).subscribe((response) => {
                if (response.success) {
                    this.alertService.show({
                        header: ``,
                        cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                        message: '<img src="assets/icons/validation.svg" class="validation-modal-icon"><br><b>Arrivage camion créé avec succès</b>',
                        buttons: [{
                            text: 'OK',
                            cssClass: 'alert-success',
                            handler: () => {
                                this.navService.runMultiplePop(4).then(() => this.mainHeaderService.emitSubTitle(''));
                            }
                        }]
                    }).then((alert) => {
                        setTimeout(() => {
                            alert.dismiss().then((success) => {
                                if(success){
                                    this.navService.runMultiplePop(4).then(() => this.mainHeaderService.emitSubTitle(''));
                                }
                            });
                        }, 3000);
                    });
                } else {
                    this.toastService.presentToast(response.msg);
                }
            });
        }
    }
}
