import {Component} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from 'moment';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';
import {SelectArticleManuallyPage} from '@pages/traca/select-article-manually/select-article-manually';
import {StorageService} from '@app/services/storage.service';


@IonicPage()
@Component({
    selector: 'page-depose-articles',
    templateUrl: 'depose-articles-traca.html',
})
export class DeposeArticlesPageTraca {

    public emplacement: Emplacement;
    public articles: Array<Article>;
    public db_articles: Array<Article>;

    private zebraScanSubscription: Subscription;
    private finishDepose: () => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private storageService: StorageService) {}

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });

        this.emplacement = this.navParams.get('emplacement');
        this.finishDepose = this.navParams.get('finishDepose');
        this.articles = this.navParams.get('articles') || [];

        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        })
    }

    public ionViewWillLeave(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    addArticleManually() {
        this.navCtrl.push(SelectArticleManuallyPage, {
            articles: this.articles,
            selectArticle: (article) => {
                const nbDroppedArticle = this.articles
                    .filter((articlePrise) => (articlePrise.reference === article.reference))
                    .length;
                this.storageService.keyExists(article.reference).subscribe((value) => {
                    if (value !== false) {
                        if (value > nbDroppedArticle) {
                            this.articles.push(article);
                            this.changeDetectorRef.detectChanges();
                        }
                        else {
                            this.toastService.showToast('Cet article est déjà enregistré assez de fois dans le panier.');
                        }
                    }
                    else {
                        this.toastService.showToast('Cet article ne correspond à aucune prise.');
                    }
                });
            }
        });
    }

    finishTaking() {
        if (this.articles && this.articles.length > 0) {
            for (let article of this.articles) {
                let numberOfArticles = 0;
                this.articles.forEach((articleToCmp) => {
                    if (articleToCmp.reference === article.reference) {
                        numberOfArticles++;
                    }
                });
                const date = moment().format();
                this.storageService.getOperateur().subscribe((value) => {
                    const mouvement: MouvementTraca = {
                        id: null,
                        ref_article: article.reference,
                        date: date + '_' + Math.random().toString(36).substr(2, 9),
                        ref_emplacement: this.emplacement.label,
                        type: 'depose',
                        operateur: value
                    };
                    this.storageService.setDeposeValue(article.barcode, numberOfArticles).subscribe(() => {
                        if (this.articles.indexOf(article) === this.articles.length - 1) {
                            this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(() => {
                                this.redirectAfterTake();
                            });
                        }
                        else {
                            this.sqliteProvider.insert('`mouvement_traca`', mouvement);
                        }
                    });
                });
            }
        }
        else {
            this.toastService.showToast('Vous devez sélectionner au moins un article')
        }
    }

    public redirectAfterTake(): void {
        this.navCtrl.pop()
            .then(() => {
                this.finishDepose();
                this.toastService.showToast('Dépose enregistrée.')
            });
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public testIfBarcodeEquals(text): void {
        let numberOfArticles = this.articles
            .filter(article => (article.reference === text))
            .length;

        let a: Article = {
            id: new Date().getUTCMilliseconds(),
            label: null,
            reference: text,
            quantite: null,
            barcode: text,
        };
        this.storageService.keyExists(text).subscribe((value) => {
            if (value !== false) {
                if (value > numberOfArticles) {
                    this.alertController
                        .create({
                            title: `Vous avez sélectionné l'article ${text}`,
                            buttons: [
                                {
                                    text: 'Annuler'
                                },
                                {
                                    text: 'Confirmer',
                                    handler: () => {
                                        this.articles.push(a);
                                        this.changeDetectorRef.detectChanges();
                                    },
                                    cssClass : 'alertAlert'
                                }
                            ]
                        })
                        .present();
                }
                else {
                    this.toastService.showToast('Cet article est déjà enregistré assez de fois dans le panier.');
                }
            }
            else {
                this.toastService.showToast('Ce colis ne correspond à aucune prise.');
            }
        });
    }
}
