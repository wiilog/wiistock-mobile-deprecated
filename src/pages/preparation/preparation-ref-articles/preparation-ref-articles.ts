import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '@app/services/toast.service';
import {ArticlePrepaByRefArticle} from '@app/entities/article-prepa-by-ref-article';
import {Observable, Subscription} from 'rxjs';
import {PreparationArticleTakePage} from '@pages/preparation/preparation-article-take/preparation-article-take';
import {IonicSelectableComponent} from 'ionic-selectable';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';


@IonicPage()
@Component({
    selector: 'page-preparation-articles',
    templateUrl: 'preparation-ref-articles.html'
})
export class PreparationRefArticlesPage {

    public static readonly LIST_WHERE_CLAUSE = (reference) => ([
        `reference_article LIKE '${reference}'`
    ]);

    @ViewChild(Navbar)
    public navBar: Navbar;
    public refArticle: ArticlePrepa;
    public articles: Array<ArticlePrepaByRefArticle>;

    public articlesToShow: Array<ArticlePrepaByRefArticle>;

    public searchArticle: string;
    public readonly MAX_DISPLAY_ITEM: number = 30;

    private zebraBarcodeSubscription: Subscription;

    private getArticleByBarcode: (barcode: string) => Observable<{selectedArticle?: ArticlePrepaByRefArticle, refArticle?: ArticlePrepa}>;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       public http: HttpClient,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
        this.articles = [];
        this.articlesToShow = [];
    }

    public ionViewWillEnter(): void {
        this.refArticle = this.navParams.get('article');
        this.getArticleByBarcode = this.navParams.get('getArticleByBarcode');

        this.sqliteProvider
            .findBy('article_prepa_by_ref_article', [`reference_article LIKE '${this.refArticle.reference}'`])
            .subscribe((articles) => {
                this.articles = articles;
                this.articlesToShow = articles;
            });

        this.zebraBarcodeSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewWillLeave(): void {
        if (this.zebraBarcodeSubscription) {
            this.zebraBarcodeSubscription.unsubscribe();
            this.zebraBarcodeSubscription = undefined;
        }
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe(barcode => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    private testIfBarcodeEquals(barcode: string): void {
        this.getArticleByBarcode(barcode).subscribe(({selectedArticle}) => {
            if (selectedArticle) {
                this.selectArticle(selectedArticle);
            }
            else {
                this.toastService.showToast('L\'article scanné n\'est pas présent dans la liste.');
            }
        });
    }

    public onArticleSearch(event: { component: IonicSelectableComponent, text: string }) {
        let text = event.text.trim();
        event.component.startSearch();
        this.sqliteProvider
            .findBy('article_prepa_by_ref_article', [
                ...PreparationRefArticlesPage.LIST_WHERE_CLAUSE(this.refArticle.reference),
                `reference LIKE '%${text}%'`
            ])
            .subscribe((items) => {
                this.articlesToShow = items;
                event.component.endSearch();
            });
    }

    public selectArticle(selectedArticle: ArticlePrepaByRefArticle): void {
        this.navCtrl.push(PreparationArticleTakePage, {
            article: selectedArticle,
            refArticle: this.refArticle,
            preparation: this.navParams.get('preparation'),
            onlyOne: (this.articles.length === 1),
            started: this.navParams.get('started'),
            valid: this.navParams.get('valid'),
            selectArticle: (selectedQuantity: number) => {
                const selectArticle = this.navParams.get('selectArticle');
                selectArticle(selectedQuantity, selectedArticle);
                this.navCtrl.pop();
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
