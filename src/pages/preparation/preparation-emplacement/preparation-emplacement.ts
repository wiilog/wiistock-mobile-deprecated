import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {Preparation} from "../../../app/entities/preparation";
import {PreparationMenuPage} from "../preparation-menu/preparation-menu";
import {HttpClient} from "@angular/common/http";
import {PreparationArticlesPage} from "../preparation-articles/preparation-articles";
import {ZebraBarcodeScannerService} from "../../../app/services/zebra-barcode-scanner.service";
import {Subscription} from "rxjs";

/**
 * Generated class for the PreparationEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-emplacement',
    templateUrl: 'preparation-emplacement.html',
})
export class PreparationEmplacementPage {
    @ViewChild(Navbar) navBar: Navbar;

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    preparation: Preparation;
    apiFinish: string = '/api/finishPrepa';

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public toastController: ToastController,
                       public barcodeScanner: BarcodeScanner,
                       public http: HttpClient,
                       public modal : ModalController,
                       private zebraBarcodeScannerService: ZebraBarcodeScannerService) {
        this.sqliteProvider.findAll('emplacement').then((value) => {
            this.db_locations = value;
            if (typeof (navParams.get('preparation')) !== undefined) {
                this.preparation = navParams.get('preparation');
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
        const myModal = this.modal.create('PreparationModalSearchEmplacementPage', {
            preparation : this.preparation
        });
        myModal.present();
    }

    ionViewDidEnter() {
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            //Write here wherever you wanna do
            this.navCtrl.push(PreparationArticlesPage, {
                preparation : this.preparation
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
                    instance.navCtrl.push(PreparationEmplacementPage, {
                        preparation : instance.preparation,
                        emplacement : element
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
                this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                    articles.forEach(function (article) {
                        instance.sqliteProvider.findMvtByArticle(article.id).then((mvt) => {
                            instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).then(() => {
                                if (articles.indexOf(article) === articles.length - 1) resolve();
                            });
                        });
                    });
                });
            });
            promise.then(() => {
                this.sqliteProvider.finishPrepaStorage().then(() => {
                    this.sqliteProvider.finishPrepa(this.preparation.id, this.emplacement.label).then(() => {
                        this.sqliteProvider.getAPI_URL().then((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    this.sqliteProvider.findAll('`preparation`').then(preparationsToSend => {
                                        this.sqliteProvider.findAll('`mouvement`').then((mvts) => {
                                            let url: string = result + this.apiFinish;
                                            let params = {
                                                preparations: preparationsToSend.filter(p => p.date_end !== null),
                                                mouvements: mvts.filter(m => m.id_livraison === null),
                                                apiKey: key
                                            };
                                            this.http.post<any>(url, params).subscribe(resp => {
                                                    if (resp.success) {
                                                        this.sqliteProvider.deletePreparations(params.preparations).then(() => {
                                                            this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                                this.navCtrl.setRoot(PreparationMenuPage);
                                                            });
                                                        });
                                                    } else {
                                                        this.showToast(resp.msg);
                                                    }
                                                },
                                                error => {
                                                    this.navCtrl.setRoot(PreparationMenuPage);
                                                    console.log(error);
                                                }
                                            );
                                        });
                                    });
                                }
                            });
                        });
                    })
                })
            })
        } else {
            this.showToast('Veuillez sélectionner ou scanner un emplacement.');
        }
    }

}
