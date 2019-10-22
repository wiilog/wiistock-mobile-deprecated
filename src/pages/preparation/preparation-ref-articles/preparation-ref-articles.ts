import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {HttpClient} from '@angular/common/http';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ToastService} from "@app/services/toast.service";
import {ArticlePrepaByRefArticle} from "@app/entities/article-prepa-by-ref-article";


@IonicPage()
@Component({
    selector: 'page-preparation-articles',
    templateUrl: 'preparation-ref-articles.html'
})
export class PreparationRefArticlesPage {

    @ViewChild(Navbar)
    public navBar: Navbar;

    public refArticle: ArticlePrepa;
    public articles: Array<ArticlePrepaByRefArticle>;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       public http: HttpClient,
                       public barcodeScanner: BarcodeScanner) {
        this.articles = [];

        // let instance = this;
        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: [
                    'io.ionic.starter.ACTION'
                ],
                filterCategories: [
                    'android.intent.category.DEFAULT'
                ]
            },
            function (intent) {
                // instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string'], true);
            });
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            // this.testIfBarcodeEquals(res.text, true);
        });
    }

    public ionViewDidEnter(): void {
        this.refArticle = this.navParams.get('article');

        this.sqliteProvider
            .findBy('article_prepa_by_ref_article', [`reference_article LIKE '${this.refArticle.reference}'`])
            .subscribe((articles) => {
                this.articles = articles;
            });
    }

    refreshOver() {
        this.toastService.showToast('Préparation prête à être finalisée.');
    }

    refresh() {
        this.toastService.showToast('Quantité bien prélevée.')
    }



    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

}
