import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {HttpClient} from '@angular/common/http';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ToastService} from "@app/services/toast.service";
import {ArticlePrepaByRefArticle} from "@app/entities/article-prepa-by-ref-article";
import {ZebraBarcodeScannerService} from "@app/services/zebra-barcode-scanner.service";
import {Observable, Subscription} from "rxjs";
import {PreparationArticleTakePage} from "@pages/preparation/preparation-article-take/preparation-article-take";


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

    private zebraBarcodeSubscription: Subscription;

    private getArticleByBarcode: (barcode: string) => Observable<{selectedArticle?: ArticlePrepaByRefArticle, refArticle?: ArticlePrepa}>;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       public http: HttpClient,
                       private barcodeScanner: BarcodeScanner,
                       private zebraBarcodeScannerService: ZebraBarcodeScannerService) {
        this.articles = [];
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    public ionViewDidEnter(): void {
        this.refArticle = this.navParams.get('article');
        this.getArticleByBarcode = this.navParams.get('getArticleByBarcode');

        this.sqliteProvider
            .findBy('article_prepa_by_ref_article', [`reference_article LIKE '${this.refArticle.reference}'`])
            .subscribe((articles) => {
                this.articles = articles;
            });

        this.zebraBarcodeSubscription = this.zebraBarcodeScannerService.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewDidLeave(): void {
        if (this.zebraBarcodeSubscription) {
            this.zebraBarcodeSubscription.unsubscribe();
            this.zebraBarcodeSubscription = undefined;
        }
    }

    private testIfBarcodeEquals(barcode: string): void {

        this.getArticleByBarcode(barcode).subscribe(({selectedArticle}) => {
            if (selectedArticle) {
                this.navCtrl.push(PreparationArticleTakePage, {
                    article: selectedArticle,
                    refArticle: this.refArticle,
                    preparation: this.navParams.get('preparation'),
                    started: this.navParams.get('started'),
                    valid: this.navParams.get('valid'),
                    selectArticle: (selectedQuantity: number) => {
                        const selectArticle = this.navParams.get('selectArticle');
                        selectArticle(selectedQuantity);
                        this.navCtrl.pop();
                    }
                });
            }
            else {
                this.toastService.showToast('L\'article scanné n\'est pas présent dans la liste.');
            }
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
