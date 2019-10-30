import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {CollecteMenuPage} from "../collecte-menu/collecte-menu";
import {HttpClient} from "@angular/common/http";
import {CollecteArticlesPage} from "../collecte-articles/collecte-articles";
import {Collecte} from "../../../app/entities/collecte";

@IonicPage()
@Component({
    selector: 'page-collecte-emplacement',
    templateUrl: 'collecte-emplacement.html',
})
export class CollecteEmplacementPage {
    @ViewChild(Navbar) navBar: Navbar;

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    collecte: Collecte;
    apiFinish: string = '/api/finishCollecte';

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public sqliteProvider: SqliteProvider,
                public toastController: ToastController,
                public barcodeScanner: BarcodeScanner,
                public http: HttpClient,
                public modal: ModalController) {
        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
            if (typeof (navParams.get('collecte')) !== undefined) {
                this.collecte = navParams.get('collecte');
            }
            if (typeof (navParams.get('emplacement')) !== undefined) {
                this.emplacement = navParams.get('emplacement');
            }
        });
        let instance = this;
        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: [
                    'io.ionic.starter.ACTION'
                ],
                filterCategories: [
                    'android.intent.category.DEFAULT'
                ]
            },
            function (intent) {
                instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string']);
            });
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    searchEmplacementModal() {
        const myModal = this.modal.create('CollecteModalSearchEmplacementPage', {
            collecte: this.collecte
        });
        myModal.present();
    }

    ionViewDidEnter() {
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            this.navCtrl.push(CollecteArticlesPage, {
                collecte: this.collecte
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
        this.sqliteProvider.findAll('`emplacement`').subscribe(resp => {
            let found = false;
            resp.forEach(function (emplacement) {
                if (emplacement.label === text) {
                    found = true;
                    instance.emplacement = emplacement;
                    instance.navCtrl.push(CollecteEmplacementPage, {
                        collecte: instance.collecte,
                        emplacement: emplacement
                    });
                }
            });
            if (!found) {
                this.showToast('Veuillez scanner ou sélectionner un emplacement connu.');
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
            console.log(this.collecte);
            let instance = this;
            let promise = new Promise<any>((resolve) => {
                this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
                    articles.forEach(function (article) {
                        instance.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                            console.log(mvts);
                            console.log(article);
                            instance.sqliteProvider.findMvtByArticleCollecte(article.id).subscribe((mvt) => {
                                console.log(mvt);
                                instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).subscribe(() => {
                                    if (articles.indexOf(article) === articles.length - 1) resolve();
                                });
                            });
                        });
                    });
                });
            });
            promise.then(() => {
                this.sqliteProvider.finishCollecte(this.collecte.id, this.emplacement.label).subscribe(() => {
                    this.sqliteProvider.getAPI_URL().subscribe((result) => {
                        this.sqliteProvider.getApiKey().then((key) => {
                            if (result !== null) {
                                this.sqliteProvider.findAll('`collecte`').subscribe(collectesToSend => {
                                    this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                        let url: string = result + this.apiFinish;
                                        let params = {
                                            collectes: collectesToSend.filter(c => c.date_end !== null),
                                            mouvements: mvts.filter(m => m.id_prepa === null),
                                            apiKey: key
                                        };
                                        this.http.post<any>(url, params).subscribe(resp => {
                                                if (resp.success) {
                                                    this.sqliteProvider.deleteCollectes(params.collectes).then(() => {
                                                        this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                            this.navCtrl.setRoot(CollecteMenuPage);
                                                        });
                                                    });
                                                } else {
                                                    this.showToast(resp.msg);
                                                }
                                            },
                                            error => {
                                                this.navCtrl.setRoot(CollecteMenuPage);
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
