import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Mouvement} from '@app/entities/mouvement';
import {CollecteArticleTakePage} from '@pages/collecte/collecte-article-take/collecte-article-take';
import {HttpClient} from '@angular/common/http';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {CollecteEmplacementPage} from '@pages/collecte/collecte-emplacement/collecte-emplacement';
import moment from 'moment';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {Collecte} from '@app/entities/collecte';
import {flatMap} from 'rxjs/operators';

@IonicPage()
@Component({
    selector: 'page-collecte-articles',
    templateUrl: 'collecte-articles.html',
})
export class CollecteArticlesPage {

    @ViewChild(Navbar) navBar: Navbar;
    collecte: Collecte;
    articlesNT: Array<ArticleCollecte>;
    articlesT: Array<ArticleCollecte>;
    started: boolean = false;
    apiStartCollecte = '/api/beginCollecte';
    isValid: boolean = true;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController,
        public sqliteProvider: SqliteProvider,
        public http: HttpClient,
        public barcodeScanner: BarcodeScanner) {
        if (typeof (navParams.get('collecte')) !== undefined) {
            this.collecte = navParams.get('collecte');
            this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
                this.articlesNT = articles.filter(article => article.has_moved === 0);
                this.articlesT = articles.filter(article => article.has_moved === 1);
                if (this.articlesT.length > 0) {
                    this.started = true;
                }
                if (navParams.get('article') !== undefined && navParams.get('quantite') !== undefined) {
                    this.isValid = this.navParams.get('valid');
                    this.started = this.navParams.get('started');
                    if (!this.started) {
                        this.sqliteProvider.getAPI_URL().subscribe((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    let url: string = result + this.apiStartCollecte;
                                    this.http.post<any>(url, {id: this.collecte.id, apiKey: key}).subscribe(resp => {
                                        if (resp.success) {
                                            this.started = true;
                                            this.isValid = true;
                                            this.showToast('Collecte commencée.');
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

    refreshOver() {
        this.showToast('Collecte prête à être finalisée.')
    }

    refresh() {
        this.showToast('Quantité bien prélevée.')
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

    // ionViewDidEnter() {
    //     this.setBackButtonAction();
    // }
    //
    //
    // setBackButtonAction() {
    //     this.navBar.backButtonClick = () => {
    //         // this.navCtrl.setRoot(CollecteMenuPage);
    //     }
    // }

    registerMvt() {
        if (this.isValid) {
            if (this.navParams.get('article').quantite !== Number(this.navParams.get('quantite'))) {
                let newArticle: ArticleCollecte = {
                    id: null,
                    label: this.navParams.get('article').label,
                    reference: this.navParams.get('article').reference,
                    quantite: Number(this.navParams.get('quantite')),
                    is_ref: this.navParams.get('article').is_ref,
                    id_collecte: this.navParams.get('article').id_collecte,
                    has_moved: 1,
                    emplacement: this.navParams.get('article').emplacement,
                    code_barre: this.navParams.get('article').code_barre,
                };
                let articleAlready = this.articlesT.find(art => art.id_collecte === newArticle.id_collecte && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleCollecteQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite).subscribe(() => {
                        this.sqliteProvider.updateArticleCollecteQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - newArticle.quantite).subscribe(() => {
                            this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
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
                    this.sqliteProvider.insert('`article_collecte`', newArticle).subscribe((insertId) => {
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
                            id_article_livraison: null,
                            id_livraison: null,
                            id_article_collecte: insertId,
                            id_collecte: newArticle.id_collecte
                        };
                        this.sqliteProvider.updateArticleCollecteQuantity(this.navParams.get('article').id, this.navParams.get('article').quantite - Number(this.navParams.get('quantite')))
                            .pipe(
                                flatMap(() => this.sqliteProvider.insert('`mouvement`', mouvement)),
                                flatMap(() => this.sqliteProvider.findArticlesByCollecte(this.collecte.id)))
                            .subscribe((articles) => {
                                if (articles.filter(article => article.has_moved === 0).length === 0) {
                                    this.refreshOver();
                                } else {
                                    this.refresh();
                                }
                                this.articlesNT = articles.filter(article => article.has_moved === 0);
                                this.articlesT = articles.filter(article => article.has_moved === 1);
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
                    id_article_livraison: null,
                    id_livraison: null,
                    id_article_collecte: this.navParams.get('article').id,
                    id_collecte: this.navParams.get('article').id_collecte
                };
                let articleAlready = this.articlesT.find(art => art.id_collecte === mouvement.id_collecte && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleCollecteQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite).subscribe(() => {
                        this.sqliteProvider.deleteById('`article_collecte`', mouvement.id_article_collecte).subscribe(() => {
                            this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
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
                    this.sqliteProvider
                        .insert('`mouvement`', mouvement)
                        .pipe(
                            flatMap(() => this.sqliteProvider.moveArticleCollecte(this.navParams.get('article').id)),
                            flatMap(() => this.sqliteProvider.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            if (articles.filter(article => article.has_moved === 0).length === 0) {
                                this.refreshOver();
                            } else {
                                this.refresh();
                            }
                            this.articlesNT = articles.filter(article => article.has_moved === 0);
                            this.articlesT = articles.filter(article => article.has_moved === 1);
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
            this.navCtrl.push(CollecteEmplacementPage, {collecte: this.collecte})
        }
    }

    testIfBarcodeEquals(text, fromText) {
        console.log(this.articlesNT);
        if (fromText && this.articlesNT.some(article => article.code_barre === text)) {
            this.navCtrl.push(CollecteArticleTakePage, {
                article: this.articlesNT.find(article => article.code_barre === text),
                collecte: this.collecte,
                started: this.started,
                valid: this.isValid
            });
        } else if (!fromText) {
            this.navCtrl.push(CollecteArticleTakePage, {
                article: text,
                collecte: this.collecte,
                started: this.started,
                valid: this.isValid
            })
        } else if (fromText && !this.articlesNT.some(article => article.code_barre === text)) {
            this.showToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

}
