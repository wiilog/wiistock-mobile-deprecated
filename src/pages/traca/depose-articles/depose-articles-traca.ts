import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {DeposeConfirmPageTraca} from '@pages/traca/depose-confirm/depose-confirm-traca';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {TracaMenuPage} from '@pages/traca/traca-menu/traca-menu';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from 'moment';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';


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

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef) {
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

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });

        this.emplacement = this.navParams.get('emplacement');
        this.articles = this.navParams.get('articles');

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
        this.navCtrl.push(DeposeConfirmPageTraca, {
            articles: this.articles, emplacement: this.emplacement
        });
    }

    finishTaking() {

        for (let article of this.articles) {
            let numberOfArticles = 0;
            this.articles.forEach((articleToCmp) => {
                if (articleToCmp.reference === article.reference) {
                    numberOfArticles++;
                }
            });
            const date = moment().format();
            this.sqliteProvider.getOperateur().then((value) => {
                const mouvement: MouvementTraca = {
                    id: null,
                    ref_article: article.reference,
                    date: date + '_' + Math.random().toString(36).substr(2, 9),
                    ref_emplacement: this.emplacement.label,
                    type: 'depose',
                    operateur: value
                };
                this.sqliteProvider.setDeposeValue(article.barcode, numberOfArticles).then(() => {
                    if (this.articles.indexOf(article) === this.articles.length - 1) {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(() => {
                            this.redirectAfterTake();
                        });
                    } else {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement);
                    }
                });
            });
        }

        //   });
    }

    redirectAfterTake() {
        this.navCtrl.setRoot(TracaMenuPage)
            .then(() => {
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

    testIfBarcodeEquals(text) {
        let numberOfArticles = 0;
        if (this.articles && this.articles.some(article => (article.reference === text))) {
            numberOfArticles++;
        }

        let a: Article = {
            id: new Date().getUTCMilliseconds(),
            label: null,
            reference: text,
            quantite: null,
            barcode: text,
        };
        this.sqliteProvider.keyExists(text).then((value) => {
            if (value !== false) {
                if (value > numberOfArticles) {
                    this.navCtrl.push(DeposeConfirmPageTraca, {
                        articles: this.articles, emplacement: this.emplacement, selectedArticle: a
                    });
                } else {
                    this.toastService.showToast('Cet article est déjà enregistré assez de fois dans le panier.');
                }
            } else {
                this.navCtrl.push(DeposeArticlesPageTraca, {emplacement : this.emplacement});
                this.toastService.showToast('Ce colis ne correspond à aucune prise.');
            }
        });
        this.changeDetectorRef.detectChanges();
    }

}
