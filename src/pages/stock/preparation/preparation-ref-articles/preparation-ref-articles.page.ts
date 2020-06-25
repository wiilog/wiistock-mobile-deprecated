import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ArticlePrepa} from '@entities/article-prepa';
import {from, Subscription} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {flatMap, map, take, tap} from 'rxjs/operators';
import {PreparationArticleTakePageRoutingModule} from '@pages/stock/preparation/preparation-article-take/preparation-article-take-routing.module';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';


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

    public constructor(private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
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
        let loader: HTMLIonLoadingElement;
        if (!this.pageHasLoadedOnce) {
            this.loading = true;
            this.pageHasLoadedOnce = true;
            this.countSubscription = this.loadingService
                .presentLoading('Chargement...')
                .pipe(
                    tap((loaderInstance) => {
                        loader = loaderInstance;
                    }),
                    flatMap(() => this.sqliteService.count('article_prepa_by_ref_article', this.listWhereClause)),
                    take(1),
                    flatMap((counter) => from(loader.dismiss()).pipe(map(() => counter)))
                )
                .subscribe((counter) => {
                    this.loading = false;
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

    public selectArticle(selectedArticle): void {
        this.navService.push(PreparationArticleTakePageRoutingModule.PATH, {
            article: selectedArticle,
            refArticle: this.refArticle,
            preparation: this.navParams.get('preparation'),
            started: this.navParams.get('started'),
            valid: this.navParams.get('valid'),
            selectArticle: (selectedQuantity: number) => {
                this.navService.pop().subscribe(() => {
                    const selectArticle = this.navParams.get('selectArticle');
                    selectArticle(selectedQuantity, selectedArticle);
                });
            }
        });
    }
}
