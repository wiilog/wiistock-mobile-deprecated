import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {Content, IonicPage, ModalController, Navbar} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {Anomalie} from '@app/entities/anomalie';
import {ModalQuantityPage} from '@pages/stock/inventaire-menu/modal-quantity';
import {Article} from '@app/entities/article';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {StorageService} from '@app/services/storage.service';


@IonicPage()
@Component({
    selector: 'page-inventaire-anomalie',
    templateUrl: 'inventaire-anomalie.html',
})
export class InventaireAnomaliePage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    anomalies: Array<Anomalie>;
    anomaliesByLocation: Array<Anomalie>;
    anomaly: Anomalie;
    article: Article;
    locations: Array<string>;
    location: string;
    isLoaded: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(private sqliteProvider: SqliteProvider,
                       private http: HttpClient,
                       private changeDetector: ChangeDetectorRef,
                       private modalController: ModalController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private storageService: StorageService) {}


    public ionViewWillEnter(): void {
        this.synchronize();
        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$
            .pipe(filter(() => this.isLoaded && this.anomalies && this.anomalies.length > 0 ))
            .subscribe((barcode: string) => {
                if (this.location) {
                    this.checkBarcodeIsRef(barcode);
                }
                else {
                    this.checkBarcodeIsLocation(barcode);
                }
            });
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public ionViewDidLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    synchronize() {
        this.isLoaded = false;
        this.apiService.getApiUrl(ApiService.TREAT_ANOMALIES).subscribe((treatAnomaliesUrl) => {
            this.storageService.getApiKey().subscribe((key) => {
                this.sqliteProvider.findAll('`anomalie_inventaire`').subscribe(anomalies => {
                    this.anomalies = anomalies;
                    let locations = [];
                    anomalies.forEach(anomaly => {
                        if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                            locations.push(anomaly.location);
                        }
                    });
                    // envoi des anomalies traitées
                    this.sqliteProvider.findByElement(`anomalie_inventaire`, 'treated', '1').subscribe((anomalies) => {
                        let params = {
                            anomalies: anomalies,
                            apiKey: key
                        };
                        this.http.post<any>(treatAnomaliesUrl, params).subscribe(resp => {
                            if (resp.success) {
                                // supprime les anomalies traitée de la base
                                this.sqliteProvider.deleteAnomalies(anomalies);
                                this.toastService.presentToast(resp.data.status);
                            } else {
                                this.isLoaded = true;
                                this.toastService.presentToast('Une erreur est survenue lors de la mise à jour des anomalies.');
                            }
                            this.locations = locations;
                            this.isLoaded = true;
                            this.content.resize();
                        });
                    });
                });
            });
        });
    }

    scanLocation() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsLocation(res);
        });
    }

    scanRef() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsRef(res);
        });
    }

    public checkBarcodeIsLocation(barcode: string): void {
        if (this.anomalies.some(anomaly => (anomaly.location === barcode))) {
            this.location = barcode;
            this.anomaliesByLocation = this.anomalies.filter(anomaly => (anomaly.location === this.location));
            this.changeDetector.detectChanges();
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }

    //TODO CG plutôt sur anomaliesByLocation ??
    public checkBarcodeIsRef(barcode: string): void {
        if (this.anomalies.some(anomaly => (anomaly.barcode === barcode))) {
            this.article = {reference: barcode};
            this.anomaly = this.anomaliesByLocation.find(anomaly => (anomaly.barcode === barcode));
            this.changeDetector.detectChanges();
            this.openModalQuantity(this.article);
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucune référence ou article.');
        }
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            this.anomaly.quantity = data.quantity;
            this.anomaly.treated = "1";

            // envoi de l'anomalie modifiée à l'API
            this.apiService.getApiUrl(ApiService.TREAT_ANOMALIES).subscribe((treatAnomaliesUrl) => {
                this.storageService.getApiKey().subscribe((apiKey) => {
                    let params = {
                        anomalies: [this.anomaly],
                        apiKey
                    };
                    this.http.post<any>(treatAnomaliesUrl, params).subscribe(resp => {
                        if (resp.success) {
                            // supprime l'anomalie traitée de la base
                            this.sqliteProvider.deleteById(`anomalie_inventaire`, this.anomaly.id);
                            this.toastService.presentToast(resp.data.status);
                            // supprime l'anomalie de la liste
                            this.anomaliesByLocation = this.anomaliesByLocation.filter(anomaly => parseInt(anomaly.treated) !== 1);
                            // si liste vide retour aux emplacements
                            if (this.anomaliesByLocation.length === 0) {
                                this.backToLocations();
                            }
                        }
                    });
                });
            });
        });
        modal.present();
    }

    backToLocations() {
        this.anomalies = this.anomalies.filter(anomaly => parseInt(anomaly.treated) !== 1);
        this.location = null;
        let locations = [];
        this.anomalies.forEach(anomaly => {
            if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                locations.push(anomaly.location);
            }
        });
        this.locations = locations;
    }

}
