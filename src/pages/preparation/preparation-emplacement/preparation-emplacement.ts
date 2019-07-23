import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {IonicSelectableComponent} from "ionic-selectable";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {Preparation} from "../../../app/entities/preparation";
import {PreparationMenuPage} from "../preparation-menu/preparation-menu";
import {HttpClient} from "@angular/common/http";

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

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    preparation: Preparation;
    apiFinish: string = 'finishPrepa';

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public sqliteProvider: SqliteProvider,
                public toastController: ToastController,
                public barcodeScanner: BarcodeScanner,
                public http: HttpClient) {
        this.sqliteProvider.findAll('emplacement').then((value) => {
            this.db_locations = value;
            if (typeof (navParams.get('preparation')) !== undefined) {
                this.preparation = navParams.get('preparation');
            }
        });
    }

    goHome() {
        this.navCtrl.push(MenuPage);
    }

    emplacementChange(event: { component: IonicSelectableComponent, value: any }) {
        this.emplacement = event.value;
        console.log(this.emplacement);
    }

    searchEmplacement(event: { component: IonicSelectableComponent, text: string }) {
        let text = event.text.trim();
        event.component.startSearch();
        event.component.items = this.sqliteProvider.findByElement('emplacement', 'label', text);
        event.component.endSearch();
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
                                            mouvements: mvts,
                                            apiKey: key
                                        };
                                        this.http.post<any>(url, params).subscribe(resp => {
                                                if (resp.success) {
                                                    this.sqliteProvider.deletePreparations(params.preparations).then(() => {
                                                        this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                            this.navCtrl.push(PreparationMenuPage);
                                                        });
                                                    });
                                                } else {
                                                    this.showToast(resp.msg);
                                                }
                                            },
                                            error => {
                                                this.navCtrl.push(PreparationMenuPage);
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
    }

}
