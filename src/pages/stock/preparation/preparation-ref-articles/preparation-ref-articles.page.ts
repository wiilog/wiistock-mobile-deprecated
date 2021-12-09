import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ArticlePrepa} from '@entities/article-prepa';
import {from, Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';


@Component({
    selector: 'wii-preparation-ref-articles',
    templateUrl: './preparation-ref-articles.page.html',
    styleUrls: ['./preparation-ref-articles.page.scss'],
})
export class PreparationRefArticlesPage extends PageComponent implements CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.ARTICLE_TO_PICK;
    public readonly barcodeScannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public listWhereClause: Array<string>;
    public refArticle: ArticlePrepa;

    public loading: boolean;

    public resetEmitter$: EventEmitter<void>;

    private pageHasLoadedOnce: boolean;
    private countSubscription: Subscription;
    private navParams: Map<string, any>;

    public skipQuantities: boolean = false;

    public constructor(private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
        this.pageHasLoadedOnce = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public wiiCanLeave(): boolean {
        return !this.loading;
    }

    public ionViewWillEnter(): void {
        this.navParams = this.currentNavParams;
        this.refArticle = this.navParams.get('article');
        this.listWhereClause = [`reference_article LIKE '${this.refArticle.reference}'`];

        this.resetEmitter$.emit();
        if (!this.pageHasLoadedOnce) {
            this.loading = true;
            this.pageHasLoadedOnce = true;
            this.countSubscription = this.loadingService
                .presentLoadingWhile({
                    event: () => zip(
                        this.sqliteService.count('article_prepa_by_ref_article', this.listWhereClause),
                        this.storageService.getBoolean(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_PREPARATIONS),
                    )
                })
                .subscribe(([counter, skipQuantities]) => {
                    this.loading = false;
                    this.skipQuantities = skipQuantities;
                    if (!counter || counter <= 0) {
                        this.toastService.presentToast('Aucun article trouvé...');
                        this.navService.pop();
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

    public selectArticle(selectedArticle: ArticlePrepaByRefArticle): void {
        if (this.skipQuantities) {
            this.selectArticleAndPop(selectedArticle, selectedArticle.quantity);
        }
        else {
            this.navService.push(NavPathEnum.PREPARATION_ARTICLE_TAKE, {
                article: selectedArticle,
                refArticle: this.refArticle,
                preparation: this.navParams.get('preparation'),
                started: this.navParams.get('started'),
                valid: this.navParams.get('valid'),
                selectArticle: (selectedQuantity: number) => {
                    this.selectArticleAndPop(selectedArticle, selectedQuantity);
                }
            });
        }
    }

    private selectArticleAndPop(selectedArticle: ArticlePrepaByRefArticle, selectedQuantity: number): void {
        this.navService.pop().subscribe(() => {
            const selectArticle = this.navParams.get('selectArticle');
            selectArticle(selectedQuantity, selectedArticle);
        });
    }
}
