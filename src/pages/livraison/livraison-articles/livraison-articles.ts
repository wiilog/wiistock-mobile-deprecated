import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Mouvement} from '@app/entities/mouvement';
import {LivraisonArticleTakePage} from '@pages/livraison/livraison-article-take/livraison-article-take';
import {HttpClient} from '@angular/common/http';
import {LivraisonEmplacementPage} from '@pages/livraison/livraison-emplacement/livraison-emplacement';
import moment from 'moment';
import {ArticleLivraison} from '@app/entities/article-livraison';
import {Livraison} from '@app/entities/livraison';
import {flatMap} from 'rxjs/operators';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';
import {ToastService} from '@app/services/toast.service';


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
    apiStartLivraison = '/api/beginLivraison';
    isValid: boolean = true;

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       public http: HttpClient,
                       public barcodeScannerManager: BarcodeScannerManagerService) {

    }

    public ionViewWillEnter(): void {
        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode, true);
        });

        this.livraison = this.navParams.get('livraison');
        this.sqliteProvider.findArticlesByLivraison(this.livraison.id).subscribe((articles) => {
            this.articlesNT = articles.filter(article => article.has_moved === 0);
            this.articlesT = articles.filter(article => article.has_moved === 1);
            if (this.articlesT.length > 0) {
                this.started = true;
            }
        });
    }

    public ionViewWillLeave(): void {
        if(this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode, true);
        });
    }

    public selectArticle(article, quantity) {
        if (!this.started) {
            this.sqliteProvider.getAPI_URL().subscribe((result) => {
                this.sqliteProvider.getApiKey().then((key) => {
                    if (result !== null) {
                        let url: string = result + this.apiStartLivraison;
                        this.http.post<any>(url, {id: this.livraison.id, apiKey: key}).subscribe(resp => {
                            if (resp.success) {
                                this.started = true;
                                this.isValid = true;
                                this.toastService.showToast('Livraison commencée.');
                                this.registerMvt(article, quantity);
                            } else {
                                this.isValid = false;
                                this.toastService.showToast(resp.msg);
                            }
                        });
                    }
                });
            });
        } else {
            this.registerMvt(article, quantity);
        }
    }

    refreshOver() {
        this.toastService.showToast('Livraison prête à être finalisée.')
    }

    refresh() {
        this.toastService.showToast('Quantité bien prélevée.')
    }

    registerMvt(article, quantity) {
        if (this.isValid) {
            if (article.quantite !== Number(quantity)) {
                let newArticle: ArticleLivraison = {
                    id: null,
                    label: article.label,
                    reference: article.reference,
                    quantite: Number(quantity),
                    is_ref: article.is_ref,
                    id_livraison: article.id_livraison,
                    has_moved: 1,
                    emplacement: article.emplacement,
                    barcode: article.barcode
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === newArticle.id_livraison && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleLivraisonQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite).subscribe(() => {
                        this.sqliteProvider.updateArticleLivraisonQuantity(article.id, article.quantite - newArticle.quantite).subscribe(() => {
                            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).subscribe((articles) => {
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
                    this.sqliteProvider.insert('`article_livraison`', newArticle).subscribe((insertId) => {
                        let mouvement: Mouvement = {
                            id: null,
                            reference: newArticle.reference,
                            quantity: article.quantite,
                            date_pickup: moment().format(),
                            location_from: newArticle.emplacement,
                            date_drop: null,
                            location: null,
                            type: 'prise-dépose',
                            is_ref: newArticle.is_ref,
                            id_article_prepa: null,
                            id_prepa: null,
                            id_article_livraison: insertId,
                            id_livraison: newArticle.id_livraison,
                            id_article_collecte: null,
                            id_collecte: null,
                        };
                        this.sqliteProvider.updateArticleLivraisonQuantity(article.id, article.quantite - Number(quantity))
                            .pipe(
                                flatMap(() => this.sqliteProvider.insert('`mouvement`', mouvement)),
                                flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id)))
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
                    reference: article.reference,
                    quantity: article.quantite,
                    date_pickup: moment().format(),
                    location_from: article.emplacement,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: article.is_ref,
                    id_article_prepa: null,
                    id_prepa: null,
                    id_article_livraison: article.id,
                    id_livraison: article.id_livraison,
                    id_article_collecte: null,
                    id_collecte: null,
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === mouvement.id_livraison && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleLivraisonQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite).subscribe(() => {
                        this.sqliteProvider.deleteById('`article_livraison`', mouvement.id_article_livraison).subscribe(() => {
                            this.sqliteProvider.findArticlesByLivraison(this.livraison.id).subscribe((articles) => {
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
                            flatMap(() => this.sqliteProvider.moveArticleLivraison(article.id)),
                            flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id))
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
            this.toastService.showToast('Veuillez traiter tous les articles concernés');
        }
        else {
            this.navCtrl.push(LivraisonEmplacementPage, {
                livraison: this.livraison,
                validateLivraison: () => {
                    this.navCtrl.pop();
                }
            });
        }
    }

    testIfBarcodeEquals(text, fromText) {
        const article = fromText
            ? this.articlesNT.find((article) => (article.barcode === text))
            : text;

        if (article) {
            this.navCtrl.push(LivraisonArticleTakePage, {
                article,
                selectArticle: (quantity) => {
                    this.selectArticle(article, quantity);
                }
            });
        }
        else {
            this.toastService.showToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

}
