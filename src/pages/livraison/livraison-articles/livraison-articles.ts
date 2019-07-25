import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {LivraisonMenuPage} from "../livraison-menu/livraison-menu";
import {Mouvement} from "../../../app/entities/mouvement";
import {LivraisonArticleTakePage} from "../livraison-article-take/livraison-article-take";
import {HttpClient} from "@angular/common/http";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {LivraisonEmplacementPage} from "../livraison-emplacement/livraison-emplacement";
import moment from "moment";
import {ArticleLivraison} from "../../../app/entities/articleLivraison";
import {Livraison} from "../../../app/entities/livraison";

/**
 * Generated class for the LivraisonArticlesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-articles',
    templateUrl: 'livraison-articles.html',
})
export class LivraisonArticlesPage {

    @ViewChild(Navbar) navBar: Navbar;
    livraison: Livraison;
    articlesNT: Array<ArticleLivraison>;
    articlesT: Array<ArticleLivraison>;
    started: boolean = false;
    apiStartLivraison = 'beginLivraison';
    isValid: boolean = true;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController,
        public sqliteProvider: SqliteProvider,
        public http: HttpClient,
        public barcodeScanner: BarcodeScanner) {
        if (typeof (navParams.get('livraison')) !== undefined) {
            this.livraison = navParams.get('livraison');
            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
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
                                    let url: string = result + this.apiStartLivraison;
                                    this.http.post<any>(url, {id: this.livraison.id, apiKey: key}).subscribe(resp => {
                                        if (resp.success) {
                                            this.started = true;
                                            this.isValid = true;
                                            this.showToast('Livraison commencée.');
                                            this.registerMvt();
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

    refresh() {
        this.showToast('Livraison prête à être finalisée.')
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


    setBackButtonAction() {
        this.navBar.backButtonClick = () => {

            //Write here wherever you wanna do
            this.navCtrl.setRoot(LivraisonMenuPage);
        }
    }

    registerMvt() {
        if (this.isValid) {
            if (this.navParams.get('article').quantite !== Number(this.navParams.get('quantite'))) {
                let newArticle: ArticleLivraison = {
                    id: null,
                    label: this.navParams.get('article').label,
                    reference: this.navParams.get('article').reference,
                    quantite: Number(this.navParams.get('quantite')),
                    is_ref: this.navParams.get('article').is_ref,
                    id_livraison: this.navParams.get('article').id_livraison,
                    has_moved: 1,
                    emplacement: this.navParams.get('article').emplacement
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === newArticle.id_livraison && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleLivraisonQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite).then(() => {
                        this.sqliteProvider.updateArticleLivraisonQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - newArticle.quantite).then(() => {
                            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
                                console.log(articles);
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
                            })
                        });
                    });
                } else {
                    this.sqliteProvider.insert('`article_livraison`', newArticle).then((rowInserted) => {
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
                            id_article_prepa: null,
                            id_prepa: null,
                            id_article_livraison: rowInserted.insertId,
                            id_livraison: newArticle.id_livraison
                        };
                        this.sqliteProvider.updateArticleLivraisonQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - Number(this.navParams.get('quantite'))).then(() => {
                            this.sqliteProvider.insert('`mouvement`', mouvement).then(() => {
                                this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
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
                    id_article_prepa: null,
                    id_prepa: null,
                    id_article_livraison: this.navParams.get('article').id,
                    id_livraison: this.navParams.get('article').id_livraison
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === mouvement.id_livraison && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleLivraisonQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite).then(() => {
                        this.sqliteProvider.delete('`article_livraison`', mouvement.id_article_livraison).then(() => {
                            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
                                    this.refresh();
                                }
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
                            })
                        });
                    });
                } else {
                    this.sqliteProvider.insert('`mouvement`', mouvement).then(() => {
                        this.sqliteProvider.moveArticleLivraison(this.navParams.get('article').id).then(() => {
                            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).then((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
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
            this.navCtrl.push(LivraisonEmplacementPage, {livraison: this.livraison})
        }
    }

    testIfBarcodeEquals(text, fromText) {
        if (fromText && this.articlesNT.some(article => article.reference === text)) {
            this.navCtrl.push(LivraisonArticleTakePage, {
                article: this.articlesNT.find(article => article.reference === text),
                livraison: this.livraison,
                started: this.started,
                valid: this.isValid
            });
        } else if (!fromText) {
            this.navCtrl.push(LivraisonArticleTakePage, {
                article: text,
                livraison: this.livraison,
                started: this.started,
                valid: this.isValid
            })
        } else if (fromText && !this.articlesNT.some(article => article.reference === text)) {

        }
    }

}
