import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {DeposeConfirmPageTraca} from '@pages/traca/depose-confirm/depose-confirm-traca';
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
    selector: 'page-depose-articles',
    templateUrl: 'depose-articles-traca.html',
})
export class DeposeArticlesPageTraca {

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
                this.sqliteProvider.setDeposeValue(mouvement.ref_article, numberOfArticles).then(() => {
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
        this.navCtrl.setRoot(StockageMenuPageTraca)
            .then(() => {
                this.showToast('Dépose enregistrée.')
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
        let numberOfArticles = 0;
        if (this.articles && this.articles.some(article => (article.reference === text))) {
            numberOfArticles++;
        }

        let a: Article;
        a = {
            id: new Date().getUTCMilliseconds(),
            label: null,
            reference: text,
            quantite: null
        };
        this.sqliteProvider.keyExists(text).then((value) => {
            if (value !== false) {
                if (value > numberOfArticles) {
                    this.navCtrl.push(DeposeConfirmPageTraca, {
                        articles: this.articles, emplacement: this.emplacement, selectedArticle: a
                    });
                } else {
                    this.showToast('Cet article est déjà enregistré assez de fois dans le panier.');
                }
            } else {
                this.navCtrl.push(DeposeArticlesPageTraca, {emplacement : this.emplacement});
                this.showToast('Ce colis ne correspond à aucune prise.');
            }
        });
        this.changeDetectorRef.detectChanges();
    }

}
