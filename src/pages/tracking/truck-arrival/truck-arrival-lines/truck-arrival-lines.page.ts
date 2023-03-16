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
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {AlertService} from "@app/common/services/alert.service";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {Carrier} from "@entities/carrier";

@Component({
    selector: 'wii-truck-arrival-lines',
    templateUrl: './truck-arrival-lines.page.html',
    styleUrls: ['./truck-arrival-lines.page.scss'],
})
export class TruckArrivalLinesPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public loading: boolean;

    public truckArrivalUnloadingLocation: Emplacement;

    public driver?: { id: number; label: string; prenom: string; id_transporteur: number };

    public carrier: Carrier;

    public registrationNumber?: string;

    public truckArrivalLinesListConfig?: Array<ListPanelItemConfig>;

    public truckArrivalLinesNumber?: Array<{
        number?: string;
    }>;

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
        this.loadingService.presentLoadingWhile({
            event: () => this.apiService.requestApi(ApiService.GET_TRUCK_ARRIVALS_LINES_NUMBER, {})
        }).subscribe((truckArrivalLinesNumber) => {
            this.truckArrivalLinesNumber = truckArrivalLinesNumber;
            if(this.truckArrivalLines.length === 0) {
                this.loading = false;
                this.mainHeaderService.emitSubTitle('Etape 3/4');
                this.carrier = this.currentNavParams.get('carrier') ?? null;
                this.driver = this.currentNavParams.get('driver') ?? null;
                this.truckArrivalUnloadingLocation = this.currentNavParams.get('truckArrivalUnloadingLocation') ?? [];
                this.registrationNumber = this.currentNavParams.get('registrationNumber') ?? null;

                this.refreshTruckArrivalLinesCards();
            }
        });
    }

    public refreshTruckArrivalLinesCards(){
        this.truckArrivalLinesListConfig = this.truckArrivalLines.map((line) => (
            {
                infos: {
                    label: {
                        value: line.number,
                        emergency: Boolean(line.reserve) || false,
                    },
                },
                leftIcon: {
                    name: 'trash.svg',
                    color: 'danger',
                    action: () => {
                        this.removeTruckArrivalLine(line.number)
                    }
                },
                rightButton: {
                    text: 'Réserve',
                    action: () => {
                        this.navService.push(NavPathEnum.TRUCK_ARRIVAL_RESERVE_DETAILS, {
                            truckArrivalLine: line,
                            newReserve: !Boolean(line.reserve),
                            type: 'quality',
                            afterValidate: (data) => {
                                if(data.delete){
                                    line.reserve = undefined;
                                } else {
                                    line.reserve = {
                                        type: 'quality',
                                        photos: data.photos,
                                        comment: data.comment,
                                    };
                                }
                                this.refreshTruckArrivalLinesCards();
                            }
                        });
                    }
                }
            }));
    }

    public testIfBarcodeEquals(truckArrivalLineNumber: string, fromClick = false): void {
        if(truckArrivalLineNumber.length < this.carrier.minTrackingNumberLength || truckArrivalLineNumber.length > this.carrier.maxTrackingNumberLength){
            const message = Boolean(this.carrier.minTrackingNumberLength) && Boolean(this.carrier.maxTrackingNumberLength)
                ? `Le numéro de tracking transporteur doit contenir entre ${this.carrier.minTrackingNumberLength} et ${this.carrier.maxTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                : (Boolean(this.carrier.minTrackingNumberLength) && truckArrivalLineNumber.length < this.carrier.minTrackingNumberLength
                    ? `Le numéro de tracking transporteur doit contenir au moins ${this.carrier.minTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                    : (Boolean(this.carrier.maxTrackingNumberLength) && truckArrivalLineNumber.length > this.carrier.maxTrackingNumberLength
                        ? `Le numéro de tracking transporteur doit contenir au maximum ${this.carrier.maxTrackingNumberLength} caractères, voulez vous l'utiliser quand même ?`
                        : ''));
            if(message){
                this.alertService.show({
                    header: '',
                    message,
                    buttons: [{
                        text: 'Confirmer',
                        cssClass: 'alert-success',
                        handler: () => {

                        }
                    }, {
                        text: 'Annuler',
                        cssClass: 'alert-danger',
                        role: 'cancel',
                    }]
                });
            } else {
                this.checkIfAlreadyExist(truckArrivalLineNumber);
            }
        } else {
            this.checkIfAlreadyExist(truckArrivalLineNumber);
        }
    }

    public checkIfAlreadyExist(truckArrivalLineNumber: string) {
        const alreadyAddedToList = this.truckArrivalLines.findIndex((line) => line.number === truckArrivalLineNumber) !== -1;
        const alreadyExistInDatabase = this.truckArrivalLinesNumber.findIndex((line) => line.number === truckArrivalLineNumber) !== -1;
        if(!alreadyAddedToList && !alreadyExistInDatabase){
            this.truckArrivalLines.push({
                number: truckArrivalLineNumber,
            });
        } else {
            this.alertService.show({
                header: '',
                message: alreadyAddedToList
                    ? 'Vous avez déjà scanné ce numéro de tracking transporteur.'
                    : (alreadyExistInDatabase
                        ? 'Vous avez déjà ajouté ce numéro de tracking transporteur à un autre arrivage camion'
                        : ''),
                buttons: [{
                    text: 'OK',
                    cssClass: 'alert-success'
                }]
            });
        }

        this.refreshTruckArrivalLinesCards();
    }

    public removeTruckArrivalLine(truckArrivalLineNumber){
        const selectedLinesToDelete = this.truckArrivalLines.findIndex((line) => line.number === truckArrivalLineNumber);
        this.truckArrivalLines.splice(selectedLinesToDelete, 1);

        this.refreshTruckArrivalLinesCards();
    }

    public next() {
        if (this.truckArrivalLines.length > 0){
            this.navService.push(NavPathEnum.TRUCK_ARRIVAL_RESERVES, {
                truckArrivalUnloadingLocation: this.truckArrivalUnloadingLocation,
                driver: this.driver,
                carrier: this.carrier,
                registrationNumber: this.registrationNumber,
                truckArrivalLines: this.truckArrivalLines,
            });
        } else {
            this.toastService.presentToast('Veuillez renseigner au moins un numéro de tracking transporteur.');
        }

    }
}
