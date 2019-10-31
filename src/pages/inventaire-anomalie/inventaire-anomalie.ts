import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {
    Content,
    IonicPage,
    ModalController,
    Navbar,
    NavController,
    NavParams,
    Platform,
    ToastController
} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {Anomalie} from '@app/entities/anomalie';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ArticleInventaire} from '@app/entities/article-inventaire';
import {ModalQuantityPage} from '../inventaire-menu/modal-quantity';
import {Article} from '@app/entities/article';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {ToastService} from "@app/services/toast.service";


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
    articleInventaire: ArticleInventaire;
    locations: Array<string>;
    location: string;
    dataApi: string = '/api/getAnomalies';
    updateAnomaliesURL: string = '/api/treatAnomalies';
    isLoaded: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(public navParams: NavParams,
                       public sqlLiteProvider: SqliteProvider,
                       public http: HttpClient,
                       public toastController: ToastController,
                       private changeDetector: ChangeDetectorRef,
                       private modalController: ModalController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toast: ToastService) {}


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
        this.sqlLiteProvider.getAPI_URL().subscribe(
            (baseUrl) => {
                if (baseUrl !== null) {
                    this.sqlLiteProvider.getApiKey().then((key) => {
                        this.sqlLiteProvider.findAll('`anomalie_inventaire`').subscribe(anomalies => {
                            this.anomalies = anomalies;
                            let locations = [];
                            anomalies.forEach(anomaly => {
                                if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                                    locations.push(anomaly.location);
                                }
                            });
                            // envoi des anomalies traitées
                            this.sqlLiteProvider.findByElement(`anomalie_inventaire`, 'treated', '1').subscribe((anomalies) => {
                                let params = {
                                    anomalies: anomalies,
                                    apiKey: key
                                };
                                let urlAnomalies: string = baseUrl + this.updateAnomaliesURL;
                                this.http.post<any>(urlAnomalies, params).subscribe(resp => {
                                    if (resp.success) {
                                        // supprime les anomalies traitée de la base
                                        this.sqlLiteProvider.deleteAnomalies(anomalies);
                                        this.toast.showToast(resp.data.status);
                                    } else {
                                        this.isLoaded = true;
                                        this.toast.showToast('Une erreur est survenue lors de la mise à jour des anomalies.');
                                    }
                                    this.locations = locations;
                                    this.isLoaded = true;
                                    this.content.resize();
                                });
                            });
                        });
                    });
                } else {
                    this.toast.showToast('Veuillez configurer votre URL dans les paramètres.')
                }
            }
        );
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
            this.toast.showToast('Ce code-barre ne correspond à aucun emplacement.');
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
            this.toast.showToast('Ce code-barre ne correspond à aucune référence ou article.');
        }
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            this.anomaly.quantity = data.quantity;
            this.anomaly.treated = "1";

            // envoi de l'anomalie modifiée à l'API
            this.sqlLiteProvider.getAPI_URL().subscribe(baseUrl => {
                if (baseUrl !== null) {
                    let url: string = baseUrl + this.updateAnomaliesURL;
                    this.sqlLiteProvider.getApiKey().then(apiKey => {
                        let params = {
                            anomalies: [this.anomaly],
                            apiKey: apiKey
                        };
                        this.http.post<any>(url, params).subscribe(resp => {
                            if (resp.success) {
                                // supprime l'anomalie traitée de la base
                                this.sqlLiteProvider.deleteById(`anomalie_inventaire`, this.anomaly.id);
                                this.toast.showToast(resp.data.status);
                                // supprime l'anomalie de la liste
                                this.anomaliesByLocation = this.anomaliesByLocation.filter(anomaly => parseInt(anomaly.treated) !== 1);
                                // si liste vide retour aux emplacements
                                if (this.anomaliesByLocation.length === 0) {
                                    this.backToLocations();
                                }
                            }
                        });
                    });
                } else {
                    this.toast.showToast('Veuillez configurer votre URL dans les paramètres.')
                }
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
