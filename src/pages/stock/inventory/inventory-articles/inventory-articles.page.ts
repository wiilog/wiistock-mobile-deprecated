import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Anomalie} from '@entities/anomalie';
import {ArticleInventaire} from '@entities/article-inventaire';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {from, Observable, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {flatMap, tap} from 'rxjs/operators';
import {SaisieInventaire} from '@entities/saisie-inventaire';
import * as moment from 'moment';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'wii-inventory-articles',
    templateUrl: './inventory-articles.page.html',
    styleUrls: ['./inventory-articles.page.scss'],
})
export class InventoryArticlesPage extends PageComponent implements CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public selectItemType: SelectItemTypeEnum;

    public dataSubscription: Subscription;
    public validateSubscription: Subscription;
    public resetEmitter$: ReplaySubject<void>;

    public requestParams: Array<string>;

    public selectedLocation: string;

    private alreadyInitialized: boolean;
    private anomalyMode: boolean;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.alreadyInitialized = false;
        this.resetEmitter$ = new ReplaySubject<void>(1);
    }

    public ionViewWillEnter(): void {
        this.selectedLocation = this.currentNavParams.get('selectedLocation');
        this.anomalyMode = this.currentNavParams.get('anomalyMode') || false;

        this.resetEmitter$.next();

        this.requestParams = [`location = '${this.selectedLocation}'`];
        if (this.anomalyMode) {
            this.requestParams.push(`treated IS NULL`);
        }

        this.selectItemType = this.anomalyMode
            ? SelectItemTypeEnum.INVENTORY_ANOMALIES_ARTICLE
            : SelectItemTypeEnum.INVENTORY_ARTICLE;

        if (!this.alreadyInitialized && !this.dataSubscription) {
            this.dataSubscription = this.loadingService
                .presentLoading('Chargement...')
                .pipe(
                    tap(() => {
                        this.refreshSubTitle();
                    }),
                    flatMap((loader) => from(loader.dismiss()))
                )
                .subscribe(() => {
                    this.unsubscribeData();
                    this.alreadyInitialized = true;
                });
        }

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.resetEmitter$.next();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return !this.dataSubscription && !this.validateSubscription;
    }

    public navigateToInventoryValidate(selectedArticle: ArticleInventaire&Anomalie): void {
        const self = this;
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_VALIDATE, {
            selectedArticle,
            validateQuantity: (quantity: number) => {
                if (!this.validateSubscription) {
                    if (!this.anomalyMode
                        || selectedArticle.is_treatable
                        || selectedArticle.quantity === quantity) {
                        this.validateSubscription = zip(
                            this.loadingService.presentLoading('Chargement...'),
                            self.validateQuantity(selectedArticle, quantity)
                        )
                            .pipe(
                                flatMap(([loader]) => zip(
                                    of(loader),
                                    this.localDataManager.sendFinishedProcess(this.anomalyMode ? 'inventoryAnomalies' : 'inventory')
                                )),
                                flatMap(([loader, resApi]: [HTMLIonLoadingElement, any]) => zip(
                                    of(loader),
                                    this.selectItemComponent.searchComponent.reload(),
                                    ((resApi && resApi.success && resApi.data && resApi.data.status)
                                        ? this.toastService.presentToast(resApi.data.status, {duration: ToastService.LONG_DURATION})
                                        : of(undefined))
                                )),
                                flatMap(([loader]) => from(loader.dismiss()))
                            )
                            .subscribe(() => {
                                this.unsubscribeValidate();
                                if (this.selectItemComponent.dbItemsLength === 0) {
                                    this.navService.pop();
                                }
                                else {
                                    this.refreshSubTitle();
                                }
                            });
                    }
                    else {
                        this.toastService.presentToast('Du stock en transit existe sur ' + (selectedArticle.is_ref ? 'la référence ' : 'l\'article ') + selectedArticle.barcode + ', l\'anomalie ne peut être validée.', {duration: ToastService.LONG_DURATION});
                    }
                }
            }
        });
    }

    public refreshSubTitle(): void {
        const articlesLength = this.selectItemComponent.dbItemsLength;
        this.mainHeaderService.emitSubTitle(articlesLength === 0
            ? 'Les inventaires pour cet emplacements sont à jour'
            : `${articlesLength} article${articlesLength > 1 ? 's' : ''}`)
    }

    public validateQuantity(selectedArticle: ArticleInventaire&Anomalie, quantity: number): Observable<any> {
        if (this.anomalyMode) {
            return this.sqliteService.update('anomalie_inventaire', [{values: {quantity, treated: '1'}, where: [`id = ${selectedArticle.id}`]}]);
        }
        else {
            let saisieInventaire: SaisieInventaire = {
                id: null,
                id_mission: selectedArticle.id_mission,
                date: moment().format(),
                bar_code: selectedArticle.barcode,
                is_ref: selectedArticle.is_ref,
                quantity,
                location: selectedArticle.location,
            };

            return zip(
                this.sqliteService.insert('saisie_inventaire', saisieInventaire),
                this.sqliteService.deleteBy('article_inventaire', [`id = ${selectedArticle.id}`])
            );
        }
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }

    private unsubscribeValidate(): void {
        if (this.validateSubscription) {
            this.validateSubscription.unsubscribe();
            this.validateSubscription = undefined;
        }
    }
}
