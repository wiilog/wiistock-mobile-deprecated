import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {DeposeConfirmPageTraca} from "../depose-confirm/depose-confirm-traca";
import {MenuPage} from "../../menu/menu";
import {Article} from "../../../app/entities/article";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {StockageMenuPageTraca} from "../stockage-menu/stockage-menu-traca";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from "../../../app/entities/mouvementTraca";
import {PriseConfirmPageTraca} from "../prise-confirm/prise-confirm-traca";


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
        this.navCtrl.push(DeposeConfirmPageTraca, {
            articles: this.articles, emplacement: this.emplacement
        });
    }

    finishTaking() {

        for (let article of this.articles) {
            let mouvement = new MouvementTraca();
            let date = new Date().toISOString();
            mouvement = {
                id: null,
                ref_article: article.reference,
                quantite: article.quantite,
                date: date,
                ref_emplacement: this.emplacement.label,
                type: 'depose'
            };
            if (this.articles.indexOf(article) === this.articles.length - 1) {
                this.sqliteProvider.insert('`mouvement_traca`', mouvement).then(() => {
                    this.redirectAfterTake();
                });
            } else {
                this.sqliteProvider.insert('`mouvement_traca`', mouvement);
            }
        }

        //   });
    }

    redirectAfterTake() {
        this.navCtrl.push(StockageMenuPageTraca)
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
        this.navCtrl.push(DeposeConfirmPageTraca, {
            articles: this.articles, emplacement: this.emplacement, selectedArticle: a
        });
        this.changeDetectorRef.detectChanges();
    }

}
