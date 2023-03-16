import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {
    FormPanelSelectComponent
} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {Carrier} from '@entities/carrier';
import {ApiService} from '@app/common/services/api.service';
import {NetworkService} from '@app/common/services/network.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {MainHeaderService} from "@app/common/services/main-header.service";

@Component({
    selector: 'wii-truck-arrival-carrier',
    templateUrl: './truck-arrival-carrier.page.html',
    styleUrls: ['./truck-arrival-carrier.page.scss'],
})
export class TruckArrivalCarrierPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private afterNext: (values) => void;

    public bodyConfig: Array<FormPanelParam>;

    public carrier: Carrier;

    public carriers: Array<Carrier>;


    public constructor(navService: NavService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataService: LocalDataManagerService,
                       private apiService: ApiService,
                       private mainHeaderService: MainHeaderService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.mainHeaderService.emitSubTitle('Etape 1/4');

        this.afterNext = this.currentNavParams.get('afterNext');
        this.carrier = this.currentNavParams.get('carrier');
        this.generateForm();
        this.synchronise();
    }

    public synchronise(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.sqliteService.findBy('carrier', [
                'recurrent = 1'
            ])
        }).subscribe((carriers) => {
            this.carriers = carriers;
        });
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    value: this.carrier ? this.carrier.id : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.CARRIER,
                        onChange: (carrierId) => {
                            this.sqliteService
                                .findOneBy(`carrier`, {id: carrierId})
                                .subscribe((newCarrier?: Carrier) => {
                                    this.carrier = newCarrier;
                                })
                        }
                    },
                }
            },
        ]
    }

    public next() {
        if (this.carrier) {
            this.navService.push(NavPathEnum.TRUCK_ARRIVAL_DRIVER, {
                carrier: this.carrier
            });
        } else {
            this.toastService.presentToast('Veuillez sélectionner un transporteur.');
        }
    }

    public onLogoClick(event: Event, id: number) {
        this.carrier = this.carriers.find(carrier => carrier.id === id);
    }

    public testIfBarcodeEquals(text) {
        const carrier = this.carriers.find(carrierI => (carrierI.label === text));
        if (carrier) {
            this.carrier = carrier;
        } else {
            this.toastService.presentToast('Le transporteur scanné n\'est pas dans la liste.');
        }
    }
}
