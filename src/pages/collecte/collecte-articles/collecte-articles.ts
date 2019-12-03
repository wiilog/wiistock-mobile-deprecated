import {Component, ViewChild} from '@angular/core';
import {Alert, AlertController, IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
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
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';
import {StorageService} from '@app/services/storage.service';
import {ApiService} from '@app/services/api.service';
import {Network} from "@ionic-native/network";


@IonicPage()
@Component({
    selector: 'page-collecte-articles',
    templateUrl: 'collecte-articles.html',
})
export class CollecteArticlesPage {

    @ViewChild(Navbar)
    public navBar: Navbar;
    public collecte: Collecte;

    public articlesNT: Array<ArticleCollecte>;
    public articlesT: Array<ArticleCollecte>;
    public started: boolean = false;
    public isValid: boolean = true;
    public loadingStartCollecte: boolean;

    private zebraScannerSubscription: Subscription;

    private partialCollecteAlert: Alert;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private http: HttpClient,
                       private network: Network,
                       private alertController: AlertController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private apiService: ApiService,
                       private storageService: StorageService) {
        this.loadingStartCollecte = false;
    }

    public ionViewWillEnter(): void {
        this.collecte = this.navParams.get('collecte');

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode, true);
        });

        this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
            this.articlesNT = articles.filter((article) => (article.has_moved === 0));
            this.articlesT = articles.filter((article) => (article.has_moved === 1));
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

    public refreshOver(): void {
        this.toastService.presentToast('Collecte prête à être finalisée.')
    }

    public refresh(): void {
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    public registerMvt(article, quantite): void {
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
                    this.sqliteProvider
                        .updateArticleCollecteQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite)
                        .pipe(
                            flatMap(() => this.sqliteProvider.updateArticleCollecteQuantity(article.id, article.quantite - newArticle.quantite)),
                            flatMap(() => this.sqliteProvider.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
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
                                this.updateList(articles);
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
                    this.sqliteProvider
                        .updateArticleCollecteQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite)
                        .pipe(
                            flatMap(() => this.sqliteProvider.deleteById('`article_collecte`', mouvement.id_article_collecte)),
                            flatMap(() => this.sqliteProvider.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                } else {
                    this.sqliteProvider
                        .insert('`mouvement`', mouvement)
                        .pipe(
                            flatMap(() => this.sqliteProvider.moveArticleCollecte(article.id)),
                            flatMap(() => this.sqliteProvider.findArticlesByCollecte(this.collecte.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                }
            }
        }
    }

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public validate(): void {
        if (this.articlesNT.length > 0) {
            this.alertPartialCollecte();
        }
        else {
            this.pushEmplacementPage();
        }
    }

    public testIfBarcodeEquals(text, fromText): void {
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
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private pushEmplacementPage(): void {
        this.navCtrl.push(CollecteEmplacementPage, {
            collecte: this.collecte,
            validateCollecte: () => {
                this.navCtrl.pop();
            }
        });
    }

    private alertPartialCollecte(): void {
        if (this.partialCollecteAlert) {
            this.partialCollecteAlert.dismiss();
            this.partialCollecteAlert = undefined;
        }
        else {
            this.partialCollecteAlert = this.alertController
                .create({
                    title: `Votre collecte est partielle`,
                    // TODO backdropDismiss: false for ionic 4
                    enableBackdropDismiss: false,
                    buttons: [
                        {
                            text: 'Annuler',
                            handler: () => {
                                this.partialCollecteAlert = undefined;
                            }
                        },
                        {
                            text: 'Continuer',
                            handler: () => {
                                this.partialCollecteAlert = undefined;
                                this.pushEmplacementPage();
                            },
                            cssClass: 'alertAlert'
                        }
                    ]
                });

            this.partialCollecteAlert.present();
        }
    }

    private selectArticle(article, quantity): void {
        if (!this.started && this.network.type !== 'none') {
            this.loadingStartCollecte = true;
            this.apiService.getApiUrl(ApiService.BEGIN_COLLECTE).subscribe((url) => {
                this.storageService.getApiKey().subscribe((key) => {
                    this.http.post<any>(url, {id: this.collecte.id, apiKey: key}).subscribe(resp => {
                        if (resp.success) {
                            this.started = true;
                            this.isValid = true;
                            this.toastService.presentToast('Collecte commencée.');
                            this.registerMvt(article, quantity);
                        }
                        else {
                            this.isValid = false;
                            this.loadingStartCollecte = false;
                            this.toastService.presentToast(resp.msg);
                        }
                    });
                });
            });
        }
        else {
            if (this.network.type === 'none') {
                this.toastService.presentToast('Collecte commencée en mode hors ligne');
            }

            this.registerMvt(article, quantity);
        }
    }

    private updateList(articles: Array<ArticleCollecte>): void {
        this.articlesNT = articles.filter((article) => (article.has_moved === 0));
        this.articlesT = articles.filter((article) => (article.has_moved === 1));
        if (this.articlesNT.length === 0) {
            this.refreshOver();
        }
        else {
            this.refresh();
        }
        this.loadingStartCollecte = false;
    }
}
