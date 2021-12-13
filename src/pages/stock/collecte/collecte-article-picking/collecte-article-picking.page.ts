import {Component, ViewChild} from '@angular/core';
import {PageComponent} from '@pages/page.component';
import {NavService} from '@app/common/services/nav/nav.service';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {ArticleCollecte} from '@entities/article-collecte';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {LoadingService} from '@app/common/services/loading.service';
import {ApiService} from '@app/common/services/api.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {map, mergeMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {ToastService} from '@app/common/services/toast.service';
import {NetworkService} from '@app/common/services/network.service';


@Component({
    selector: 'wii-collecte-article-picking',
    templateUrl: './collecte-article-picking.page.html',
    styleUrls: ['./collecte-article-picking.page.scss'],
})
export class CollecteArticlePickingPage extends PageComponent implements ViewWillEnter, ViewWillLeave {

    public showArticlePicking: boolean = false;

    public readonly selectItemType = SelectItemTypeEnum.COLLECTABLE_ARTICLES;
    public readonly selectItemMode = BarcodeScannerModeEnum.TOOL_SEARCH;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public barcodeValidator = (barcode: string) => this.validateBarcode(barcode);

    private article: ArticleCollecte;
    private selectArticle: (quantity: number, article?: ArticleCollecte) => void;

    public constructor(navService: NavService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private apiService: ApiService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        super.ionViewWillEnter();

        this.article = this.currentNavParams.get('article');
        this.selectArticle = this.currentNavParams.get('selectArticle');
        this.showArticlePicking = false;

        if (this.networkService.hasNetwork()) {
            this.loadingService
                .presentLoadingWhile({
                    event: () => {
                        return this.sqliteService.deleteBy('picking_article_collecte')
                            .pipe(
                                mergeMap(() => (
                                    this.apiService
                                        .requestApi(ApiService.GET_COLLECTABLE_ARTICLES, {
                                            params: {
                                                reference: this.article.reference
                                            }
                                        })
                                )),
                                mergeMap(({articles}) => (
                                    articles && articles.length
                                        ? this.sqliteService.insert('picking_article_collecte', articles).pipe(map(() => articles))
                                        : of(articles)
                                ))
                            )
                    }
                })
                .subscribe(
                    (articles) => {
                        this.showArticlePicking = articles.length > 0;
                        setTimeout(() => {
                            if (this.showArticlePicking) {
                                this.selectItemComponent.fireZebraScan();
                            }
                        });
                    },
                    () => {
                        this.showArticlePicking = false;
                    });
        }
        else {
            this.showArticlePicking = false;
        }
    }

    public ionViewWillLeave(): void {
        this.selectItemComponent.unsubscribeZebraScan();
    }

    public onGenerateNewArticle(): void {
        this.navService.push(NavPathEnum.COLLECTE_ARTICLE_TAKE, {
            article: this.article,
            selectArticle: (quantity: number) => {
                this.selectArticle(quantity);
            }
        });
    }

    public pickArticle(pickedArticle: ArticleCollecte): void {
        this.navService.push(NavPathEnum.COLLECTE_ARTICLE_TAKE, {
            article: this.article,
            pickedArticle: pickedArticle,
            selectArticle: (quantity: number) => {
                this.selectArticle(quantity, pickedArticle);
            }
        });
    }

    public validateBarcode(barcode: string): Observable<ArticleCollecte> {
        return this.loadingService
            .presentLoadingWhile({
                event: () => this.apiService.requestApi(ApiService.GET_COLLECTABLE_ARTICLES, {
                    params: {
                        reference: this.article.reference,
                        barcode
                    }
                })
            })
            .pipe(
                map(({articles}) => articles ? articles[0] : undefined)
            );
    }
}
