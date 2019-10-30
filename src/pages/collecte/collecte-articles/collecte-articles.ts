import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Mouvement} from '@app/entities/mouvement';
import {CollecteArticleTakePage} from '@pages/collecte/collecte-article-take/collecte-article-take';
import {HttpClient} from '@angular/common/http';
import {CollecteEmplacementPage} from '@pages/collecte/collecte-emplacement/collecte-emplacement';
import moment from 'moment';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {Collecte} from '@app/entities/collecte';
import {flatMap} from 'rxjs/operators';
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {Subscription} from "rxjs";


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

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       public http: HttpClient,
                       public barcodeScannerManager: BarcodeScannerManagerService) {
    }

    public ionViewWillEnter(): void {
        this.collecte = this.navParams.get('collecte');

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode, true);
        });

        this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
            this.articlesNT = articles.filter(article => article.has_moved === 0);
            this.articlesT = articles.filter(article => article.has_moved === 1);
            if (this.articlesT.length > 0) {
                this.started = true;
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.zebraScannerSubscription) {
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

    refreshOver() {
        this.toastService.showToast('Collecte prête à être finalisée.')
    }

    refresh() {
        this.toastService.showToast('Quantité bien prélevée.')
    }

    registerMvt(article, quantite) {
        if (this.isValid) {
            if (article.quantite !== Number(quantite)) {
                let newArticle: ArticleCollecte = {
                    id: null,
                    label: article.label,
                    reference: article.reference,
                    quantite: Number(quantite),
                    is_ref: article.is_ref,
                    id_collecte: article.id_collecte,
                    has_moved: 1,
                    emplacement: article.emplacement,
                    barcode: article.barcode,
                };
                let articleAlready = this.articlesT.find(art => (
                    (art.id_collecte === newArticle.id_collecte) &&
                    (art.is_ref === newArticle.is_ref) &&
                    (art.reference === newArticle.reference)
                ));
                if (articleAlready !== undefined) {
                    this.sqliteProvider.updateArticleCollecteQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite).subscribe(() => {
                        this.sqliteProvider.updateArticleCollecteQuantity(article.id, article.quantite - newArticle.quantite).subscribe(() => {
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
                            quantity: article.quantite,
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
                        this.sqliteProvider.updateArticleCollecteQuantity(article.id, article.quantite - Number(quantite))
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
                    id_article_livraison: null,
                    id_livraison: null,
                    id_article_collecte: article.id,
                    id_collecte: article.id_collecte
                };
                let articleAlready = this.articlesT.find(art => (
                    (art.id_collecte === mouvement.id_collecte) &&
                    (art.is_ref === mouvement.is_ref) &&
                    (art.reference === mouvement.reference)
                ));
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
                            flatMap(() => this.sqliteProvider.moveArticleCollecte(article.id)),
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
            this.toastService.showToast('Veuillez traiter tous les articles concernés');
        }
        else {
            this.navCtrl.push(CollecteEmplacementPage, {
                collecte: this.collecte,
                validateCollecte: () => {
                    this.navCtrl.pop();
                }
            })
        }
    }

    testIfBarcodeEquals(text, fromText) {
        const article = fromText
            ? this.articlesNT.find(article => (article.barcode === text))
            : text;
        if (article) {
            this.navCtrl.push(CollecteArticleTakePage, {
                article,
                selectArticle: (quantity: number) => {
                    this.selectArticle(article, quantity);
                }
            });
        }
        else {
            this.toastService.showToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private selectArticle(article, quantity): void {
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
                                this.toastService.showToast('Collecte commencée.');
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

}
