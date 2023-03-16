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

    public refreshFormReserves(generalReserveChecked?: boolean, quantityReserveChecked?: boolean, options: { quantity?: number; quantityType?: string; comment?: string; } = {}){
        const {generalComment, quantityComment} = this.formPanelComponent.values;
        this.truckArrivalReservesListConfig = [
            {
                item: FormPanelToggleComponent,
                config: {
                    label: 'Réserve',
                    name: 'generalReserve',
                    value: generalReserveChecked,
                    inputConfig: {
                        onChange: (value) => {
                            this.refreshFormReserves(value, quantityReserveChecked);
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
                    }
                }]
                : []),
            {
                item: FormPanelToggleComponent,
                config: {
                    label: 'Réserve ' + (options && options.quantity && options.quantityType
                        ? (': ' + options.quantity + ' UL en ' + (options.quantityType === 'minus' ? 'moins' : 'plus'))
                        : ''),
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
                                            quantity: data.quantity,
                                            quantityType: data.quantityType,
                                            comment: data.comment || '',
                                        });
                                        this.refreshFormReserves(generalReserveChecked, value, {
                                            quantity: data.quantity,
                                            quantityType: data.quantityType,
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
                        title: 'Réserve qualité +/-',
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
                    value: '',
                    inputConfig: {

                    }
                }
            }
        ];
    }
    public validate() {
        const {generalComment, signatures} = this.formPanelComponent.values;
        if(generalComment){
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
            if(response.success){
                this.navService.runMultiplePop(4);
            } else {
                this.toastService.presentToast(response.msg);
            }
        });

    }
}
