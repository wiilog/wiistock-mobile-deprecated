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
        this.sqlLiteProvider.getAPI_URL().then((result) => {
            if (result !== null) {
                let url: string = result + this.dataApi;
                this.sqlLiteProvider.getApiKey().then((key) => {
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
                                        console.log(anomalies);
                                        anomalies.forEach(anomaly => {
                                            if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                                                locations.push(anomaly.location);
                                            }
                                        });
                                        console.log(locations);
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
                            this.showToast('Une erreur est survenue.');
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
            this.anomalies = this.anomalies.filter(anomaly => anomaly.location == this.location);
        } else {
            this.showToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }

    checkBarcodeIsRef(text) {
        if (this.anomalies.some(anomaly => anomaly.reference === text)) {
            //TODO CG récupérer id anomaly pour le mettre dans anomaly ?
            this.article = new Article();
            this.article.reference = text;
            console.log(this.article);
            this.openModalQuantity(this.article);
        } else {
            this.showToast('Ce code-barre ne correspond à aucune référence ou article.');
        }
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            console.log(data);
            console.log(this.anomaly);
            this.sqlLiteProvider.findOne('`anomalie_inventaire`', this.anomaly.id).then((data) => {
                console.log(data);
                //TODO CG
                // envoie l'anomalie modifiée à l'api
                // supprime l'anomalie de la base
                // supprime l'anomalie de la liste
            });
        });
        modal.present();
    }

}
