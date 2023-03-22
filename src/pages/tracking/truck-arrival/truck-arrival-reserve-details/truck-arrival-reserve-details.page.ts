import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {ToastService} from "@app/common/services/toast.service";
import {StorageService} from "@app/common/services/storage/storage.service";
import {ApiService} from "@app/common/services/api.service";
import {LoadingService} from "@app/common/services/loading.service";
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
import {
    FormPanelCameraComponent
} from "@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component";
import {TabConfig} from "@app/common/components/tab/tab-config";


enum QuantityType {
    MINUS = 1,
    PLUS = 2,
}

@Component({
    selector: 'wii-truck-arrival-reserve-details',
    templateUrl: './truck-arrival-reserve-details.page.html',
    styleUrls: ['./truck-arrival-reserve-details.page.scss'],
})
export class TruckArrivalReserveDetailsPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public QUALITY = 'quality';
    public QUANTITY = 'quantity';

    public defaultQuantityType = QuantityType.MINUS;

    public WII_INPUT_NUMBER_LABEL = "Ecart quantité";

    public loading: boolean;

    public reserveDetailsListConfig: Array<FormPanelParam>;

    public reserveType?: string;

    public tabConfig: TabConfig[] = [
        { label: 'En moins', key: QuantityType.MINUS },
        { label: 'En plus', key: QuantityType.PLUS }
    ];

    public truckArrivalLine?: {
        number?: string;
        reserve?: {
            type?: string;
            comment?: string;
            photos?: Array<string>;
        }
    };

    public reserve?: {
        type?: string;
        quantity?: number;
        quantityType?: string
    };

    public newReserve?: boolean;

    public afterValidate: (data) => void;

    public constructor(navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public storageService: StorageService,
                       public toastService: ToastService,
                       public alertService: AlertService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.loading = false;
        this.truckArrivalLine = this.currentNavParams.get('truckArrivalLine') ?? [];
        this.newReserve = this.currentNavParams.get('newReserve') ?? true;
        this.reserveType = this.currentNavParams.get('type');
        this.afterValidate = this.currentNavParams.get('afterValidate');

        this.reserve = {

        };
        this.generateReserveDetails();
    }

    public generateReserveDetails(){
        if (this.reserveType === this.QUALITY){
            this.reserveDetailsListConfig = [
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'N° tracking transporteur',
                        value: this.truckArrivalLine.number,
                        name: 'truckArrivalLineNumber',
                        inputConfig: {
                            type: 'text',
                        },
                        section: {
                            title: 'Réserve qualité ',
                            bold: true,
                            logo: 'emergency.svg',
                        }
                    }
                },
                {
                    item: FormPanelCameraComponent,
                    config: {
                        label: 'Photo(s)',
                        name: 'photos',
                        value: !this.newReserve ? this.truckArrivalLine.reserve.photos : '',
                        inputConfig: {
                            multiple: true
                        }
                    }
                },
                {
                    item: FormPanelInputComponent,
                    config: {
                        label: 'Commentaire',
                        value: !this.newReserve ? this.truckArrivalLine.reserve.comment   : '',
                        name: 'qualityComment',
                        inputConfig: {
                            type: 'text',
                        },
                    }
                },
            ];
        } else if (this.reserveType === this.QUANTITY) {
            this.reserveDetailsListConfig = [
                {
                    item: FormPanelInputComponent,
                        config: {
                    label: 'Commentaire',
                        value: !this.newReserve ? this.truckArrivalLine.reserve.comment   : '',
                        name: 'quantityComment',
                        inputConfig: {
                            type: 'text',
                        },
                    }
                },
            ];
        }
    }

    public deleteReserve(){
        this.navService.pop().subscribe(() => {
            this.afterValidate({
                delete: true,
            });
        });
    }

    public setReserveQuantity(value?: number){
        this.reserve.quantity = value;
    }

    public onChangeQuantityType(value: any){
        this.reserve.quantityType =
            value === QuantityType.MINUS
                ? 'minus'
                : (value === QuantityType.PLUS
                    ? 'plus' : '');
    }

    public validate() {
        let data = {};
        if(this.reserveType === this.QUALITY){
            const {photos, qualityComment} = this.formPanelComponent.values;

            data = {photos, comment: qualityComment};
        } else if(this.reserveType === this.QUANTITY) {
            const {quantityComment} = this.formPanelComponent.values;

            data = {
                comment: quantityComment,
                quantity: this.reserve.quantity,
                quantityType: this.reserve.quantityType,
            };
        }

        this.navService.pop().subscribe(() => {
            this.afterValidate(data);
        });
    }
}
