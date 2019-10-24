import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {Preparation} from '@app/entities/preparation';
import {PreparationMenuPage} from '@pages/preparation/preparation-menu/preparation-menu';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '@app/services/toast.service';


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

    private isLoaded: boolean;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public barcodeScanner: BarcodeScanner,
                       public http: HttpClient,
                       public modal: ModalController,
                       private toastService: ToastService) {

        this.isLoaded = false;

        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
            if (typeof (navParams.get('preparation')) !== undefined) {
                this.preparation = navParams.get('preparation');
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
        const myModal = this.modal.create('PreparationModalSearchEmplacementPage', {
            preparation : this.preparation
        });
        myModal.present();
    }

    ionViewDidEnter() {
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
        this.sqliteProvider.findAll('`emplacement`').subscribe((resp: Array<Emplacement>) => {
            const foundEmplacement = resp.find((emplacement: Emplacement) => (emplacement.label === text));

            if (foundEmplacement) {
                this.emplacement = foundEmplacement;
                this.navCtrl.push(PreparationEmplacementPage, {
                    preparation: this.preparation,
                    emplacement: foundEmplacement
                })
            }
            else {
                this.toastService.showToast('Veuillez flasher ou sélectionner un emplacement connu.');
            }
        });
    }

    validate() {
        if (!this.isLoaded) {
            if (this.emplacement.label !== '') {
                this.isLoaded = true;
                let instance = this;
                let promise = new Promise<any>((resolve) => {
                    this.sqliteProvider.findArticlesByPrepa(this.preparation.id).subscribe((articles) => {
                        articles.forEach(function (article) {
                            instance.sqliteProvider.findMvtByArticle(article.id).subscribe((mvt) => {
                                instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).subscribe(() => {
                                    if (articles.indexOf(article) === articles.length - 1) resolve();
                                });
                            });
                        });
                    });
                });
                promise.then(() => {
                    this.sqliteProvider.finishPrepaStorage().then(() => {
                        this.sqliteProvider.finishPrepa(this.preparation.id, this.emplacement.label).subscribe(() => {
                            this.sqliteProvider.getAPI_URL().subscribe((result) => {
                                this.sqliteProvider.getApiKey().then((key) => {
                                    if (result !== null) {
                                        this.sqliteProvider.findAll('`preparation`').subscribe(preparationsToSend => {
                                            this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
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
                                                                    this.isLoaded = false;
                                                                    this.navCtrl.setRoot(PreparationMenuPage);
                                                                });
                                                            });
                                                        }
                                                        else {
                                                            this.isLoaded = false;
                                                            this.toastService.showToast(resp.msg);
                                                        }
                                                    },
                                                    error => {
                                                        this.isLoaded = false;
                                                        this.navCtrl.setRoot(PreparationMenuPage);
                                                    }
                                                );
                                            });
                                        });
                                    }
                                    else {
                                        this.isLoaded = false;
                                    }
                                });
                            });
                        })
                    })
                })
            }
            else {
                this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

}
