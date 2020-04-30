import {Component, ViewChild} from '@angular/core';
import {IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {ToastService} from '@app/services/toast.service';
import {PreparationArticleTakePage} from '@pages/stock/preparation/preparation-article-take/preparation-article-take';
import {SelectItemTypeEnum} from '@helpers/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {SelectItemComponent} from '@helpers/components/select-item/select-item.component';
import {flatMap, map, take, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {LoadingService} from '@app/services/loading.service';
import {from} from 'rxjs/observable/from';


@IonicPage()
@Component({
    selector: 'page-preparation-ref-articles',
    templateUrl: 'preparation-ref-articles.html'
})
export class PreparationRefArticlesPage {

    @ViewChild('selectItemComponent')
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.ARTICLE_TO_PICK;
    public readonly barcodeScannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public listWhereClause: Array<string>;
    public refArticle: ArticlePrepa;

    public loading: boolean;
    private pageHasLoadedOnce: boolean;
    private countSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteProvider: SqliteProvider) {
        this.loading = true;
        this.pageHasLoadedOnce = false;
    }

    public ionViewCanLeave(): boolean {
        return (!this.selectItemComponent || !this.selectItemComponent.isScanning) && !this.loading;
    }

    public ionViewWillEnter(): void {
        this.refArticle = this.navParams.get('article');
        this.listWhereClause = [`reference_article LIKE '${this.refArticle.reference}'`];
        let loader: Loading;
        if (!this.pageHasLoadedOnce) {
            this.loading = true;
            this.pageHasLoadedOnce = true;
            this.countSubscription = this.loadingService
                .presentLoading('Chargement...')
                .pipe(
                    tap((loaderInstance) => {
                        loader = loaderInstance;
                    }),
                    flatMap(() => this.sqliteProvider.count('article_prepa_by_ref_article', this.listWhereClause)),
                    take(1),
                    flatMap((counter) => from(loader.dismiss()).pipe(map(() => counter)))
                )
                .subscribe((counter) => {
                    this.loading = false;
                    if (!counter || counter <= 0) {
                        this.toastService.presentToast('Aucun article trouvé...');
                        this.navCtrl.pop();
                    }
                    else if (this.selectItemComponent) {
                        this.selectItemComponent.fireZebraScan();
                    }
                });
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
        if (this.countSubscription) {
            this.countSubscription.unsubscribe();
            this.countSubscription = undefined;
        }
    }

    public selectArticle(selectedArticle): void {
        this.navCtrl.push(PreparationArticleTakePage, {
            article: selectedArticle,
            refArticle: this.refArticle,
            preparation: this.navParams.get('preparation'),
            started: this.navParams.get('started'),
            valid: this.navParams.get('valid'),
            selectArticle: (selectedQuantity: number) => {
                const selectArticle = this.navParams.get('selectArticle');
                selectArticle(selectedQuantity, selectedArticle);
                this.navCtrl.pop();
            }
        });
    }
}
