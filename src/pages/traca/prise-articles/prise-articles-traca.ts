import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {PriseConfirmPageTraca} from "../prise-confirm/prise-confirm-traca";
import {MenuPage} from "../../menu/menu";
import {Article} from "../../../app/entities/article";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {StockageMenuPageTraca} from "../stockage-menu/stockage-menu-traca";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from "../../../app/entities/mouvementTraca";


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
        this.db_articles = this.sqliteProvider.findAll('article');
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
            let mouvement = new MouvementTraca();
            let date = new Date().toISOString();
            this.sqliteProvider.getOperateur().then((value) => {
                mouvement = {
                    id: null,
                    ref_article: article.reference,
                    date: date,
                    ref_emplacement: this.emplacement.label,
                    type: 'prise',
                    operateur: value
                };
                this.sqliteProvider.setPriseValue(mouvement.ref_article, numberOfArticles).then(() => {
                    if (this.articles.indexOf(article) === this.articles.length - 1) {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement).then(() => {
                            this.redirectAfterTake();
                        }).catch(err => console.log(err));
                    } else {
                        this.sqliteProvider.insert('`mouvement_traca`', mouvement).catch(err => console.log(err));
                    }
                });
            });
        }

        //   });
    }

    redirectAfterTake() {
        this.navCtrl.push(StockageMenuPageTraca)
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
        this.navCtrl.push(MenuPage);
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
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
