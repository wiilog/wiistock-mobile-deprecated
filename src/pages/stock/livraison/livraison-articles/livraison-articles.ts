import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Mouvement} from '@app/entities/mouvement';
import {LivraisonArticleTakePage} from '@pages/stock/livraison/livraison-article-take/livraison-article-take';
import {LivraisonEmplacementPage} from '@pages/stock/livraison/livraison-emplacement/livraison-emplacement';
import moment from 'moment';
import {ArticleLivraison} from '@app/entities/article-livraison';
import {Livraison} from '@app/entities/livraison';
import {flatMap} from 'rxjs/operators';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {Network} from '@ionic-native/network';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@helpers/components/panel/model/icon-config';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {IconColor} from '@helpers/components/icon/icon-color';


@IonicPage()
@Component({
    selector: 'page-livraison-articles',
    templateUrl: 'livraison-articles.html',
})
export class LivraisonArticlesPage {
    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public livraison: Livraison;

    public articlesNT: Array<ArticleLivraison>;
    public articlesT: Array<ArticleLivraison>;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public livraisonsHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
        info?: string;
    };

    public started: boolean = false;
    public isValid: boolean = true;

    public loadingStartLivraison: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private network: Network,
                       private apiService: ApiService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
        this.loadingStartLivraison = false;
    }

    public ionViewWillEnter(): void {
        this.livraison = this.navParams.get('livraison');

        this.livraisonsHeaderConfig = {
            leftIcon: {name: 'delivery.svg'},
            title: `Livraison ${this.livraison.numero}`,
            subtitle: `Destination : ${this.livraison.emplacement}`
        };

        this.listBoldValues = ['label', 'barCode', 'location', 'quantity'];

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode);
        });

        this.sqliteProvider.findArticlesByLivraison(this.livraison.id).subscribe((articles) => {
            this.updateList(articles, true);

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
        return !this.footerScannerComponent.isScanning;
    }

    public selectArticle(article, quantity) {
        if (!this.started && this.network.type !== 'none') {
            this.loadingStartLivraison = true;
            this.apiService
                .requestApi('post', ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}})
                .subscribe((resp) => {
                    if (resp.success) {
                        this.started = true;
                        this.isValid = true;
                        this.toastService.presentToast('Livraison commencée.');
                        this.registerMvt(article, quantity);
                    }
                    else {
                        this.isValid = false;
                        this.loadingStartLivraison = false;
                        this.toastService.presentToast(resp.msg);
                    }
                });
        }
        else {
            if (this.network.type === 'none') {
                this.toastService.presentToast('Livraison commencée en mode hors ligne');
            }

            this.registerMvt(article, quantity);
        }
    }

    public refreshOver(): void {
        this.toastService.presentToast('Livraison prête à être finalisée.')
    }

    public refresh(): void {
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    public registerMvt(article, quantity): void {
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
                    this.sqliteProvider
                        .updateArticleLivraisonQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite)
                        .pipe(
                            flatMap(() => this.sqliteProvider.updateArticleLivraisonQuantity(article.id, article.quantite - newArticle.quantite)),
                            flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
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
                        this.sqliteProvider
                            .updateArticleLivraisonQuantity(article.id, article.quantite - Number(quantity))
                            .pipe(
                                flatMap(() => this.sqliteProvider.insert('`mouvement`', mouvement)),
                                flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id)))
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
                    id_article_livraison: article.id,
                    id_livraison: article.id_livraison,
                    id_article_collecte: null,
                    id_collecte: null,
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === mouvement.id_livraison && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    this.sqliteProvider
                        .updateArticleLivraisonQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite)
                        .pipe(
                            flatMap(() => this.sqliteProvider.deleteBy('`article_livraison`', mouvement.id_article_livraison)),
                            flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                } else {
                    this.sqliteProvider
                        .insert('`mouvement`', mouvement)
                        .pipe(
                            flatMap(() => this.sqliteProvider.moveArticleLivraison(article.id)),
                            flatMap(() => this.sqliteProvider.findArticlesByLivraison(this.livraison.id))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                }
            }
        }
    }

    public validate(): void {
        if ((this.articlesNT.length > 0) ||
            (this.articlesT.length === 0)) {
            this.toastService.presentToast('Veuillez traiter tous les articles concernés');
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

    public testIfBarcodeEquals(text, fromText: boolean = true): void {
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
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesNumber = (this.articlesNT ? this.articlesNT.length : 0);
        const articlesPlural = articlesNumber > 1 ? 's' : '';
        return articlesNumber > 0
            ? {
                header: {
                    title: 'À livrer',
                    info: `${articlesNumber} article${articlesPlural} à scanner`,
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-yellow-light'
                    }
                },
                body: this.articlesNT.map((articleLivraison: ArticleLivraison) => ({
                    infos: this.createArticleInfo(articleLivraison),
                    rightIcon: {
                        color: 'grey' as IconColor,
                        name: 'up.svg',
                        action: () => {
                            this.testIfBarcodeEquals(articleLivraison, false)
                        }
                    }
                }))
            }
            : undefined;
    }

    private ceateListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const pickedArticlesNumber = (this.articlesT ? this.articlesT.length : 0);
        const pickedArticlesPlural = pickedArticlesNumber > 1 ? 's' : '';
        return {
            header: {
                title: 'Livré',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} scanné${pickedArticlesPlural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-yellow'
                },
                rightIcon: {
                    name: 'check.svg',
                    color: 'success',
                    action: () => {
                        this.validate()
                    }
                }
            },
            body: this.articlesT.map((articleLivraison: ArticleLivraison) => ({
                infos: this.createArticleInfo(articleLivraison)
            }))
        };
    }

    private createArticleInfo({label, barcode, emplacement, quantite}: ArticleLivraison): {[name: string]: { label: string; value: string; }} {
        return {
            label: {
                label: 'Label',
                value: label
            },
            ...(
                barcode
                    ? {
                        barCode: {
                            label: 'Code barre',
                            value: barcode
                        }
                    }
                    : {}
            ),
            ...(
                emplacement && emplacement !== 'null'
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: emplacement
                        }
                    }
                    : {}
            ),
            ...(
                quantite
                    ? {
                        quantity: {
                            label: 'Quantité',
                            value: `${quantite}`
                        }
                    }
                    : {}
            )
        };
    }

    private updateList(articles: Array<ArticleLivraison>, isInit: boolean = false): void {
        this.articlesNT = articles.filter(({has_moved}) => (has_moved === 0));
        this.articlesT = articles.filter(({has_moved}) => (has_moved === 1));

        this.listToTreatConfig = this.createListToTreatConfig();
        this.listTreatedConfig = this.ceateListTreatedConfig();

        if (!isInit) {
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            }
            else {
                this.refresh();
            }
            this.loadingStartLivraison = false;
        }
    }

}
