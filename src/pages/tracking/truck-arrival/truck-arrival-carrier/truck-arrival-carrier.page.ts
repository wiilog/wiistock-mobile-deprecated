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
import {Transporteur} from '@entities/transporteur';
import {ApiService} from '@app/common/services/api.service';
import {NetworkService} from '@app/common/services/network.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {ArticleCollecte} from '@entities/article-collecte';

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

    public carrier: {id: number ; label: string ; logo: string ; minTrackingNumberLength?: number ; maxTrackingNumberLength?: number};

    public carriers: Array<Transporteur>;

    public loading: boolean;

    public constructor(navService: NavService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataService: LocalDataManagerService,
                       private apiService: ApiService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.afterNext = this.currentNavParams.get('afterNext');
        this.carrier = this.currentNavParams.get('carrier');
        this.generateForm();
        this.synchronise();
    }

    public synchronise(): void {
        if (this.networkService.hasNetwork()) {
            this.loading = true;

            this.loadingService.presentLoading('Récupération des transporteurs en cours').subscribe(loader => {
                this.apiService.requestApi(ApiService.GET_CARRIERS).subscribe(response => {
                    if (response.success) {
                        loader.dismiss();

                        this.carriers = response.carriers;
                        if(Object.keys(this.carriers).length === 0) {
                            this.carriers = null;
                        }

                        this.loading = false;
                    }
                });
            });
        } else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
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
                                .findOneBy(`transporteur`, {id: carrierId})
                                .subscribe((newCarrier?: Transporteur) => {
                                    this.carrier = {
                                        id: carrierId,
                                        label: newCarrier.label,
                                        logo: newCarrier.logo,
                                        minTrackingNumberLength: newCarrier.minTrackingNumberLength ?? null,
                                        maxTrackingNumberLength: newCarrier.maxTrackingNumberLength ?? null,
                                    }
                                })
                        }
                    },
                }
            },
        ]
    }

    public next() {
        if (this.carrier) {
            this.navService.pop().subscribe(() => {
                this.afterNext({
                    carrier: this.carrier,
                });
            })
        } else {
            this.toastService.presentToast('Veuillez sélectionner un transporteur.');
        }
    }

    public onLogoClick(event: Event, id: number) {
        this.carrier = this.carriers.find(carrier => carrier.id === id);
        const selectSelector = document.querySelector('wii-form-field');
        console.log(selectSelector);
        const logoCardSelector = document.getElementById(String(id)).parentElement;
        const selected = document.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
        logoCardSelector.classList.add('selected');
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
