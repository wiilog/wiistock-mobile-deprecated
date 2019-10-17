import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {PriseConfirmPageTraca} from '@pages/traca/prise-confirm/prise-confirm-traca';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {StockageMenuPageTraca} from '@pages/traca/stockage-menu/stockage-menu-traca';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from 'moment';


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

    emplacement: Emplacement;
    articles: Array<Article>;
    db_articles: Array<Article>;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private toastController: ToastController,
        private sqliteProvider: SqliteProvider,
        private barcodeScanner: BarcodeScanner,
        private changeDetectorRef: ChangeDetectorRef) {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });
        if (typeof (navParams.get('emplacement')) !== undefined) {
            this.emplacement = navParams.get('emplacement');
        }

        if (typeof (navParams.get('articles')) !== undefined) {
            this.articles = navParams.get('articles');
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
                instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string']);
            });
    }

    addArticleManually() {
        this.navCtrl.push(PriseConfirmPageTraca, {
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
                    type: 'prise',
                    operateur: value
                };
                this.sqliteProvider.setPriseValue(mouvement.ref_article, numberOfArticles).then(() => {
                    if (this.articles.indexOf(article) === this.articles.length - 1) {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(
                            () => {
                                this.redirectAfterTake();
                            },
                            err => console.log(err)
                        );
                    } else {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(() => {}, (err) => console.log(err));
                    }
                });
            });
        }

        //   });
    }

    redirectAfterTake() {
        this.navCtrl.setRoot(StockageMenuPageTraca)
            .then(() => {
                this.showToast('Prise enregistrée.')
            });
    }

    // Helper
    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center'
        });
        toast.present();
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
        if (this.articles && this.articles.some(article => (article.reference === text))) {
            this.showToast('Cet article a déjà été ajouté à la prise.');
        } else {
            let a: Article;
            a = {
                id: new Date().getUTCMilliseconds(),
                label: null,
                reference: text,
                quantite: null
            };
            this.navCtrl.push(PriseConfirmPageTraca, {
                articles: this.articles, emplacement: this.emplacement, selectedArticle: a
            });
            this.changeDetectorRef.detectChanges();
        }
    }

}
