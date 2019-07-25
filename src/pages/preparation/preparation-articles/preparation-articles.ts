import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Preparation} from "../../../app/entities/preparation";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {ArticlePrepa} from "../../../app/entities/articlePrepa";
import {PreparationMenuPage} from "../preparation-menu/preparation-menu";
import {Mouvement} from "../../../app/entities/mouvement";
import {PreparationArticleTakePage} from "../preparation-article-take/preparation-article-take";
import {HttpClient} from "@angular/common/http";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {PreparationEmplacementPage} from "../preparation-emplacement/preparation-emplacement";
import moment from "moment";

/**
 * Generated class for the PreparationArticlesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-articles',
    templateUrl: 'preparation-articles.html',
})
export class PreparationArticlesPage {

    @ViewChild(Navbar) navBar: Navbar;
    preparation: Preparation;
    articlesNT: Array<ArticlePrepa>;
    articlesT: Array<ArticlePrepa>;
    started: boolean = false;
    apiStartPrepa = 'beginPrepa';
    isValid: boolean = true;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController,
        public sqliteProvider: SqliteProvider,
        public http: HttpClient,
        public barcodeScanner: BarcodeScanner) {
        if (typeof (navParams.get('preparation')) !== undefined) {
            this.preparation = navParams.get('preparation');
            this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                this.articlesNT = articles.filter(article => article.has_moved === 0);
                this.articlesT = articles.filter(article => article.has_moved === 1);
                if (this.articlesT.length > 0) {
                    this.started = true;
                }
                if (navParams.get('article') !== undefined && navParams.get('quantite') !== undefined) {
                    this.isValid = this.navParams.get('valid');
                    this.started = this.navParams.get('started');
                    if (!this.started) {
                        this.sqliteProvider.getAPI_URL().then((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    let url: string = result + this.apiStartPrepa;
                                    this.http.post<any>(url, {id: this.preparation.id, apiKey: key}).subscribe(resp => {
                                        if (resp.success) {
                                            this.started = true;
                                            this.isValid = true;
                                            this.sqliteProvider.startPrepa(this.preparation.id).then(() => {
                                                this.showToast('Préparation commencée.');
                                                this.registerMvt();
                                            });
                                        } else {
                                            this.isValid = false;
                                            this.showToast(resp.msg);
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        this.registerMvt();
                    }
                }
            })
        }

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
                instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string'], true);
            });
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text, true);
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

    ionViewDidEnter() {
        this.setBackButtonAction();
    }

    refreshOver() {
        this.showToast('Préparation prête à être finalisée.')
    }

    refresh() {
        this.showToast('Quantité bien prélevée.')
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {

            //Write here wherever you wanna do
            this.navCtrl.setRoot(PreparationMenuPage);
        }
    }

    registerMvt() {
        if (this.isValid) {
            if (this.navParams.get('article').quantite !== Number(this.navParams.get('quantite'))) {
                let newArticle: ArticlePrepa = {
                    id: null,
                    label: this.navParams.get('article').label,
                    reference: this.navParams.get('article').reference,
                    quantite: Number(this.navParams.get('quantite')),
                    is_ref: this.navParams.get('article').is_ref,
                    id_prepa: this.navParams.get('article').id_prepa,
                    has_moved: 1,
                    emplacement: this.navParams.get('article').emplacement
                };
                let articleAlready = this.articlesT.find(art => art.id_prepa === newArticle.id_prepa && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite).then(() => {
                        this.sqliteProvider.updateArticleQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - newArticle.quantite).then(() => {
                            this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
                                    this.refreshOver();
                                } else {
                                    this.refresh();
                                }
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
                            })
                        });
                    });
                } else {
                    this.sqliteProvider.insert('`article_prepa`', newArticle).then((rowInserted) => {
                        console.log(rowInserted.insertId);
                        let mouvement: Mouvement = {
                            id: null,
                            reference: newArticle.reference,
                            quantity: this.navParams.get('article').quantite,
                            date_pickup: moment().format(),
                            location_from: newArticle.emplacement,
                            date_drop: null,
                            location: null,
                            type: 'prise-dépose',
                            is_ref: newArticle.is_ref,
                            id_article_prepa: rowInserted.insertId,
                            id_prepa: newArticle.id_prepa,
                            id_article_livraison: null,
                            id_livraison: null
                        };
                        this.sqliteProvider.updateArticleQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - Number(this.navParams.get('quantite'))).then(() => {
                            this.sqliteProvider.insert('`mouvement`', mouvement).then(() => {
                                this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                                    if (articles.filter(article => article.has_moved === 0).length === 0) {
                                        this.refreshOver();
                                    } else {
                                        this.refresh();
                                    }
                                    this.articlesNT = articles.filter(article => article.has_moved === 0);
                                    this.articlesT = articles.filter(article => article.has_moved === 1);
                                })
                            });
                        });
                    });
                }
            } else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: this.navParams.get('article').reference,
                    quantity: this.navParams.get('article').quantite,
                    date_pickup: moment().format(),
                    location_from: this.navParams.get('article').emplacement,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: this.navParams.get('article').is_ref,
                    id_article_prepa: this.navParams.get('article').id,
                    id_prepa: this.navParams.get('article').id_prepa,
                    id_article_livraison: null,
                    id_livraison: null
                };
                let articleAlready = this.articlesT.find(art => art.id_prepa === mouvement.id_prepa && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite).then(() => {
                        this.sqliteProvider.delete('`article_prepa`', mouvement.id_article_prepa).then(() => {
                            this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
                                    this.refreshOver();
                                } else {
                                    this.refresh();
                                }
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
                            })
                        });
                    });
                } else {
                    this.sqliteProvider.insert('`mouvement`', mouvement).then(() => {
                        this.sqliteProvider.moveArticle(this.navParams.get('article').id).then(() => {
                            this.sqliteProvider.findArticlesByPrepa(this.preparation.id).then((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
                                    this.refreshOver();
                                } else {
                                    this.refresh();
                                }
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
                            })
                        });
                    });
                }
            }
        }
    }


    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    validate() {
        if (this.articlesNT.length > 0) {
            this.showToast('Veuillez traiter tous les articles concernés');
        } else {
            this.navCtrl.push(PreparationEmplacementPage, {preparation: this.preparation})
        }
    }

    testIfBarcodeEquals(text, fromText) {
        if (fromText && this.articlesNT.some(article => article.reference === text)) {
            this.navCtrl.push(PreparationArticleTakePage, {
                article: this.articlesNT.find(article => article.reference === text),
                preparation: this.preparation,
                started: this.started,
                valid: this.isValid
            });
        } else if (!fromText) {
            this.navCtrl.push(PreparationArticleTakePage, {
                article: text,
                preparation: this.preparation,
                started: this.started,
                valid: this.isValid
            })
        } else if (fromText && !this.articlesNT.some(article => article.reference === text)) {

        }
    }

}
