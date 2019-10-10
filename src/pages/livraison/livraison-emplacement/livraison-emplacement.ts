import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {LivraisonMenuPage} from "../livraison-menu/livraison-menu";
import {HttpClient} from "@angular/common/http";
import {LivraisonArticlesPage} from "../livraison-articles/livraison-articles";
import {Livraison} from "../../../app/entities/livraison";
import {Subscription} from "rxjs";
import {ZebraBarcodeScannerService} from "../../../app/services/zebra-barcode-scanner.service";

/**
 * Generated class for the LivraisonEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-emplacement',
    templateUrl: 'livraison-emplacement.html',
})
export class LivraisonEmplacementPage {
    @ViewChild(Navbar) navBar: Navbar;

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    livraison: Livraison;
    apiFinish: string = '/api/finishLivraison';

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public toastController: ToastController,
                       public barcodeScanner: BarcodeScanner,
                       public http: HttpClient,
                       public modal: ModalController,
                       private zebraBarcodeScannerService: ZebraBarcodeScannerService) {
        this.sqliteProvider.findAll('emplacement').then((value) => {
            this.db_locations = value;
            if (typeof (navParams.get('livraison')) !== undefined) {
                this.livraison = navParams.get('livraison');
            }
            if (typeof (navParams.get('emplacement')) !== undefined) {
                this.emplacement = navParams.get('emplacement');
            }
        });
    }

    public ionViewDidLoad(): void {
        this.zebraScannerSubscription = this.zebraBarcodeScannerService.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewDidLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    searchEmplacementModal() {
        const myModal = this.modal.create('LivraisonModalSearchEmplacementPage', {
            livraison: this.livraison
        });
        myModal.present();
    }

    ionViewDidEnter() {
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            //Write here wherever you wanna do
            this.navCtrl.push(LivraisonArticlesPage, {
                livraison: this.livraison
            });
        }
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
        let instance = this;
        this.sqliteProvider.findAll('`emplacement`').then(resp => {
            let found = false;
            resp.forEach(function (element) {
                if (element.label === text) {
                    found = true;
                    instance.emplacement = element;
                    instance.navCtrl.push(LivraisonEmplacementPage, {
                        livraison: instance.livraison,
                        emplacement: element
                    })
                }
            });
            if (!found) {
                this.showToast('Veuillez flasher ou séléctionner un emplacement connu.');
            }
        });
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

    validate() {
        if (this.emplacement.label !== '') {
            let instance = this;
            let promise = new Promise<any>((resolve) => {
                this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
                    articles.forEach(function (article) {
                        instance.sqliteProvider.findMvtByArticleLivraison(article.id).then((mvt) => {
                            instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).then(() => {
                                if (articles.indexOf(article) === articles.length - 1) resolve();
                            });
                        });
                    });
                });
            });
            promise.then(() => {
                this.sqliteProvider.finishLivraison(this.livraison.id, this.emplacement.label).then(() => {
                    this.sqliteProvider.getAPI_URL().then((result) => {
                        this.sqliteProvider.getApiKey().then((key) => {
                            if (result !== null) {
                                this.sqliteProvider.findAll('`livraison`').then(livraisonsToSend => {
                                    this.sqliteProvider.findAll('`mouvement`').then((mvts) => {
                                        let url: string = result + this.apiFinish;
                                        let params = {
                                            livraisons: livraisonsToSend.filter(p => p.date_end !== null),
                                            mouvements: mvts.filter(m => m.id_prepa === null),
                                            apiKey: key
                                        };
                                        this.http.post<any>(url, params).subscribe(resp => {
                                                if (resp.success) {
                                                    this.sqliteProvider.deleteLivraisons(params.livraisons).then(() => {
                                                        this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                            this.navCtrl.setRoot(LivraisonMenuPage);
                                                        });
                                                    });
                                                } else {
                                                    this.showToast(resp.msg);
                                                }
                                            },
                                            error => {
                                                this.navCtrl.setRoot(LivraisonMenuPage);
                                                console.log(error);
                                            }
                                        );
                                    });
                                });
                            }
                        });
                    })
                })
            })
        } else {
            this.showToast('Veuillez sélectionner ou scanner un emplacement.');
        }
    }

}
