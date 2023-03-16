import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {ToastService} from "@app/common/services/toast.service";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {StorageService} from "@app/common/services/storage/storage.service";
import {Emplacement} from "@entities/emplacement";
import {ApiService} from "@app/common/services/api.service";
import {LoadingService} from "@app/common/services/loading.service";
import {Driver} from "@entities/driver";
import {MainHeaderService} from "@app/common/services/main-header.service";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {Carrier} from "@entities/carrier";

@Component({
    selector: 'wii-truck-arrival-driver',
    templateUrl: './truck-arrival-driver.page.html',
    styleUrls: ['./truck-arrival-driver.page.scss'],
})
export class TruckArrivalDriverPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;


    public bodyConfig: Array<FormPanelParam>;

    public truckArrivalDefaultUnloadingLocationId: number;

    public truckArrivalUnloadingLocationId: number;

    public truckArrivalUnloadingLocation: Emplacement;

    public driver: { id: number; label: string; prenom: string; id_transporteur: number };

    public carrier: Carrier;

    public constructor(navService: NavService,
                       public sqliteService: SqliteService,
                       public apiService: ApiService,
                       public loadingService: LoadingService,
                       public storageService: StorageService,
                       public toastService: ToastService,
                       private mainHeaderService: MainHeaderService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.mainHeaderService.emitSubTitle('Etape 2/4');
        this.carrier = this.currentNavParams.get('carrier') ?? null;
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_TRUCK_ARRIVALS_DEFAULT_UNLOADING_LOCATION)
        }).subscribe((defaultUnloadingLocationId) => {
            this.truckArrivalDefaultUnloadingLocationId = defaultUnloadingLocationId;
            this.generateForm();
        });
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Chauffeur',
                    name: 'driver',
                    inputConfig: {
                        searchType: SelectItemTypeEnum.DRIVER,
                        requestParams: [`id_transporteur = ${this.carrier.id}`],
                        onChange: (driverId) => {
                            this.sqliteService
                                .findOneBy('driver', {id: driverId})
                                .subscribe((selectedDriver?: Driver) => {
                                    this.driver = {
                                        id: selectedDriver.id,
                                        label: selectedDriver.label,
                                        prenom: selectedDriver.prenom,
                                        id_transporteur: selectedDriver.id_transporteur,
                                    }
                                })
                        }
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Immatriculation',
                    name: 'registrationNumber',
                    inputConfig: {
                        type: 'text',
                    },
                    errors: {
                        required: 'Votre commentaire est requis',
                    }
                }
            },
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Emplacement',
                    name: 'unloadingLocation',
                    value: this.truckArrivalDefaultUnloadingLocationId ?? null,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.LOCATION,
                        onChange: (unloadingLocationId) => {
                            this.truckArrivalUnloadingLocationId = unloadingLocationId;
                        }
                    },
                    section: {
                        title: 'Emplacement de déchargement',
                        bold: true,
                    },
                    errors: {
                        required: 'Vous devez sélectionner un emplacement de déchargement.'
                    }
                }
            },
        ];
    }

    public next() {
        const {registrationNumber} = this.formPanelComponent.values;
        this.sqliteService.findOneById('emplacement', this.truckArrivalUnloadingLocationId || this.truckArrivalDefaultUnloadingLocationId).subscribe((unloadingLocation) => {
            if (unloadingLocation) {
                this.truckArrivalUnloadingLocation = unloadingLocation;
                this.navService.push(NavPathEnum.TRUCK_ARRIVAL_LINES, {
                    truckArrivalUnloadingLocation: this.truckArrivalUnloadingLocation,
                    driver: this.driver,
                    carrier: this.carrier,
                    registrationNumber,
                });
            } else {
                this.toastService.presentToast('Veuillez sélectionner un emplacement de déchargement.');
            }
        });
    }
}
