import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {PriseConfirmPage} from "../prise-confirm/prise-confirm";
import {MenuPage} from "../../menu/menu";
import {Article} from "../../../app/entities/article";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {StockageMenuPage} from "../stockage-menu/stockage-menu";
import {Mouvement} from '../../../app/entities/mouvement';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles.html',
})
export class PriseArticlesPage {

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
        this.navCtrl.push(PriseConfirmPage, {
            articles: this.articles, emplacement: this.emplacement
        });
    }

    finishTaking() {

        for (let article of this.articles) {
            const date = new Date().toISOString();
            const mouvement: Mouvement = {
                id: null,
                reference: article.reference,
                quantity: article.quantite,
                date_pickup: date,
                location_from: this.emplacement.label,
                date_drop: null,
                location: null,
                type: 'prise-depose',
                is_ref: null,
                id_article_prepa: article.id,
                id_prepa: null,
                id_livraison: null,
                id_article_livraison: null,
                id_article_collecte: null,
                id_collecte: null,
            };
            if (this.articles.indexOf(article) === this.articles.length - 1) {
                this.sqliteProvider.insert('`mouvement`', mouvement).subscribe(() => {
                    this.redirectAfterTake();
                });
            } else {
                this.sqliteProvider.insert('`mouvement`', mouvement);
            }
        }
    }

    redirectAfterTake() {
        this.navCtrl.setRoot(StockageMenuPage)
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

    // TODO AB merge supprime foreach
    testIfBarcodeEquals(text) {
        let found = false;
        this.db_articles.forEach(article => {
            if (article['barcode'] === text && !found) {
                found = true;
                this.navCtrl.push(PriseConfirmPage, {
                    articles: this.articles, emplacement: this.emplacement, selectedArticle: article
                });
            }
        });
        if (!found) {
            this.toastController.create({
                message: 'Aucun article ne correspond à l\'article scanné',
                duration: 3000,
                position: 'center',
                cssClass: 'toast-error'
            }).present();
        }
        this.changeDetectorRef.detectChanges();
    }

}
