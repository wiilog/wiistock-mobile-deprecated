import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, ModalController, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {Anomalie} from "../../app/entities/anomalie";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {ArticleInventaire} from "../../app/entities/articleInventaire";
import {ModalQuantityPage} from "../inventaire/inventaire-menu/modal-quantity";
import {Article} from "../../app/entities/article";


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
    updateAnomaliesURL : string = '/api/treatAnomalies';
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public http: HttpClient,
        public toastController: ToastController,
        public barcodeScanner: BarcodeScanner,
        private modalController: ModalController,
    ) {}

    ionViewDidLoad() {
        console.log('ionViewDidLoad InventaireAnomaliePage');
    }

    ionViewDidEnter() {
        this.synchronize();
    }

    synchronize() {
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().then((baseUrl) => {
            if (baseUrl !== null) {

                this.sqlLiteProvider.getApiKey().then((key) => {
                    // envoi des anomalies traitées
                    let anomalies = this.sqlLiteProvider.findByElement(`anomalie_inventaire`, 'treated', '1');
                    let urlAnomalies: string = baseUrl + this.updateAnomaliesURL;
                    let params = {
                        anomalies: anomalies,
                        apiKey: key
                    };
                    this.http.post<any>(urlAnomalies, params).subscribe(resp => {
                        if (resp.success) {
                            // supprime les anomalies traitée de la base
                            this.sqlLiteProvider.deleteAnomalies(anomalies);
                            this.showToast(resp.data.status);
                        } else {
                            this.hasLoaded = true;
                            this.showToast('Une erreur est survenue lors de la mise à jour des anomalies.');
                        }
                    });

                    // mise à jour de la base locale des anomalies d'inventaire
                    let url: string = baseUrl + this.dataApi;
                    this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                        if (resp.success) {
                            this.sqlLiteProvider.cleanTable('`anomalie_inventaire`').then(() => {
                                this.sqlLiteProvider.importAnomaliesInventaire(resp).then((sqlAnomaliesInventaire) => {
                                    if (sqlAnomaliesInventaire !== false) {
                                        this.sqlLiteProvider.executeQuery(sqlAnomaliesInventaire).then(() => {
                                            console.log('Imported anomalies inventaire');
                                        });
                                    }
                                }).then(() => {
                                    this.sqlLiteProvider.findAll('`anomalie_inventaire`').then(anomalies => {
                                        this.anomalies = anomalies;
                                        let locations = [];
                                        anomalies.forEach(anomaly => {
                                            if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                                                locations.push(anomaly.location);
                                            }
                                        });
                                        this.locations = locations;

                                        setTimeout(() => {
                                            this.hasLoaded = true;
                                            this.content.resize();
                                        }, 1000);
                                    });
                                });
                            });
                        } else {
                            this.hasLoaded = true;
                            this.showToast('Une erreur est survenue lors de la mise à jour des anomalies d\'inventaire.');
                        }
                    }, error => {
                        this.hasLoaded = true;
                        this.showToast('Une erreur réseau est survenue.');
                    });
                });
            } else {
                this.showToast('Veuillez configurer votre URL dans les paramètres.')
            }
        }).catch(err => console.log(err));
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

    scanLocation() {
        this.barcodeScanner.scan().then(res => {
            this.checkBarcodeIsLocation(res.text);
        });
    }

    scanRef() {
        this.barcodeScanner.scan().then(res => {
            this.checkBarcodeIsRef(res.text);
        });
    }

    checkBarcodeIsLocation(text) {
        if (this.anomalies.some(anomaly => anomaly.location === text)) {
            this.location = text;
            this.anomaliesByLocation = this.anomalies.filter(anomaly => anomaly.location == this.location);
        } else {
            this.showToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }
    //TODO CG plutôt sur anomaliesByLocation ??
    checkBarcodeIsRef(text) {
        if (this.anomalies.some(anomaly => anomaly.reference === text)) {
            this.article = new Article();
            this.article.reference = text;
            this.anomaly = this.anomaliesByLocation.find(anomaly => anomaly.reference == text);
            this.openModalQuantity(this.article);
        } else {
            this.showToast('Ce code-barre ne correspond à aucune référence ou article.');
        }
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            this.anomaly.quantity = data.quantity;
            this.anomaly.treated = "1";

            // envoi de l'anomalie modifiée à l'API
            this.sqlLiteProvider.getAPI_URL().then(baseUrl => {
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
                                this.showToast(resp.data.status);
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
                    this.showToast('Veuillez configurer votre URL dans les paramètres.')
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