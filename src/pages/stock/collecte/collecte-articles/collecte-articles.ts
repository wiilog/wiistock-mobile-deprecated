import {Component, ViewChild} from '@angular/core';
import {Alert, AlertController, IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Mouvement} from '@app/entities/mouvement';
import moment from 'moment';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {Collecte} from '@app/entities/collecte';
import {flatMap} from 'rxjs/operators';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Observable, Subscription} from 'rxjs';
import {ApiService} from '@app/services/api.service';
import {Network} from '@ionic-native/network';
import {CollecteArticleTakePage} from "@pages/stock/collecte/collecte-article-take/collecte-article-take";
import {of} from "rxjs/observable/of";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {AlertManagerService} from "@app/services/alert-manager.service";


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

    private isLoading: boolean;

    private goToDepose: () => void;
    private canLeave: boolean;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private network: Network,
                       private localDataManager: LocalDataManagerService,
                       private alertController: AlertController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private apiService: ApiService) {
        this.loadingStartCollecte = false;
        this.isLoading = false;
        this.canLeave = true;
    }

    public ionViewWillEnter(): void {
        this.isLoading = false;
        this.collecte = this.navParams.get('collecte');
        this.goToDepose = this.navParams.get('goToDepose');

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
        return this.canLeave && this.barcodeScannerManager.canGoBack;
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
                            quantity: Number(quantite),
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
                            flatMap(() => this.sqliteProvider.deleteBy('`article_collecte`', mouvement.id_article_collecte)),
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

    public validate(): void {
        if (this.articlesT.length === 0) {
            this.toastService.presentToast('Veuillez sélectionner au moins une ligne');
        } else if (this.articlesNT.length > 0) {
            this.alertPartialCollecte();
        } else {
            this.finishCollecte();
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
        } else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private alertPartialCollecte(): void {
        if (this.partialCollecteAlert) {
            this.partialCollecteAlert.dismiss();
            this.partialCollecteAlert = undefined;
        } else {
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
                                this.finishCollecte();
                            },
                            cssClass: 'alert-success'
                        }
                    ]
                });

            this.partialCollecteAlert.present();
        }
    }

    private selectArticle(article, quantity): void {
        if (!this.started && this.network.type !== 'none') {
            this.loadingStartCollecte = true;
            this.apiService
                .requestApi('post', ApiService.BEGIN_COLLECTE, {params: {id: this.collecte.id}})
                .subscribe((resp) => {
                    if (resp.success) {
                        this.started = true;
                        this.isValid = true;
                        this.toastService.presentToast('Collecte commencée.');
                        this.registerMvt(article, quantity);
                    } else {
                        this.isValid = false;
                        this.loadingStartCollecte = false;
                        this.toastService.presentToast(resp.msg);
                    }
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
        } else {
            this.refresh();
        }
        this.loadingStartCollecte = false;
    }

    private finishCollecte(): void {
        if (!this.isLoading) {
            this.isLoading = true;

            this.sqliteProvider
                .findArticlesByCollecte(this.collecte.id)
                .pipe(
                    flatMap((articles) => Observable.zip(
                        ...articles.map((article) => (
                            this.sqliteProvider
                                .findMvtByArticleCollecte(article.id)
                                .pipe(flatMap((mvt) => (
                                    mvt
                                        ? this.sqliteProvider.finishMvt(mvt.id)
                                        : of(undefined)
                                )))
                        ))
                    )),
                    flatMap(() => this.sqliteProvider.finishCollecte(this.collecte.id)),
                    flatMap((): any => (
                        this.network.type !== 'none'
                            ? this.localDataManager.sendFinishedProcess('collecte')
                            : of({offline: true})
                    ))
                )
                .subscribe(
                    ({offline, success}: any) => {
                        if (this.collecte && this.collecte.forStock) {
                            this.canLeave = false;
                            this.alertController
                                .create({
                                    title: 'Collecte validée',
                                    cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
                                    message: 'Pour valider l\'entrée en stock vous devez effectuer la dépose',
                                    buttons: [{
                                        text: 'Aller vers la dépose',
                                        cssClass: 'alert-success',
                                        handler: () => {
                                            this.canLeave = true;
                                            this.closeScreen(offline ? [] : success, offline);
                                            this.goToDepose();
                                        }
                                    }]
                                })
                                .present();
                        }
                        else {
                            this.closeScreen(offline ? [] : success, offline);
                        }
                    },
                    (error) => {
                        this.handlePreparationError(error);
                    });
        } else {
            this.toastService.presentToast('Chargement en cours veuillez patienter.');
        }
    }

    private closeScreen(success: Array<{ newCollecte, articlesCollecte }>, isOffline: boolean = false): void {
        if(isOffline || success.length > 0) {
            this.toastService.presentToast(
                (success.length > 0)
                    ? (
                        (success.length === 1
                            ? 'Votre collecte a bien été enregistrée'
                            : `Votre collecte et ${success.length - 1} collecte${success.length - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
                    )
                    : 'Collecte sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé'
            );
        }

        this.isLoading = false;
        this.navCtrl.pop();
    }

    private handlePreparationError(resp): void {
        this.isLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
    }
}
