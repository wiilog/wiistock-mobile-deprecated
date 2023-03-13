import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {map, take, tap} from 'rxjs/operators';
import {ArticleInventaire} from '@entities/article-inventaire';
import {Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {TableName} from '@app/common/services/sqlite/table-definition';


@Component({
    selector: 'wii-search-item',
    templateUrl: 'search-item.component.html',
    styleUrls: ['./search-item.component.scss']
})
export class SearchItemComponent implements OnInit, OnDestroy {

    private static readonly LENGTH_TO_LOAD: number = 30;

    public _item: any;

    @Input()
    public type: SelectItemTypeEnum;

    @Input()
    public requestParams?: Array<string> = [];

    @Input()
    public elements?: Array<{ id: string|number; label: string; }>;

    @Input()
    public isMultiple?: boolean = false;

    @Input()
    public filterItem?: (item: any) => boolean;

    @Output()
    public itemChange: EventEmitter<any>;

    @Output()
    public itemsLoaded: EventEmitter<void>;

    @ViewChild('itemComponent', {static: false})
    public itemComponent: IonicSelectableComponent;

    public dbItemsForList: Array<any>;

    private dbItems: Array<any>;

    private lastSearch: string;

    private itemsSubscription: Subscription;

    public readonly config = SearchItemComponent.SEARCH_CONFIGS;

    public static readonly SEARCH_CONFIGS: {[type: string]: {[conf: string]: any; databaseTable?: TableName}} = {
        default: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            placeholder: 'Sélectionnez un élément'
        },
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            label: 'barcode',
            valueField: 'barcode',
            templateIndex: 'article-prepa',
            databaseTable: 'article_prepa_by_ref_article',
            placeholder: 'Sélectionnez l\'article',
            requestOrder: {
                'pickingPriority': 'DESC',
                'management_order IS NULL': 'ASC', // put null at the end
                'management_order': 'ASC'
            }
        },
        [SelectItemTypeEnum.LOCATION]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'emplacement',
            placeholder: 'Sélectionnez un emplacement',
            requestOrder: {
                'label': 'ASC'
            }
        },
        [SelectItemTypeEnum.TRACKING_NATURES]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'nature',
            placeholder: 'Sélectionnez une nature',
            requestOrder: {
                'label': 'ASC'
            }
        },
        [SelectItemTypeEnum.INVENTORY_LOCATION]: SearchItemComponent.MakeMapForInventoryLocations(false),
        [SelectItemTypeEnum.INVENTORY_ARTICLE]: SearchItemComponent.MakeMapForInventoryArticles(false),
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION]: SearchItemComponent.MakeMapForInventoryLocations(true),
        [SelectItemTypeEnum.INVENTORY_ANOMALIES_ARTICLE]: SearchItemComponent.MakeMapForInventoryArticles(true),
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'demande_livraison_type',
            placeholder: 'Sélectionnez un type'
        },
        [SelectItemTypeEnum.DISPATCH_TYPE]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'dispatch_type',
            placeholder: 'Sélectionnez un type'
        },
        [SelectItemTypeEnum.USER]: {
            label: 'username',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'user',
            placeholder: 'Sélectionnez un utilisateur'
        },
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES]: {
            label: 'bar_code',
            valueField: 'bar_code',
            templateIndex: 'article-demande',
            databaseTable: 'demande_livraison_article',
            placeholder: 'Sélectionnez un article'
        },
        [SelectItemTypeEnum.STATUS]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'status',
            placeholder: 'Sélectionnez un statut',
            requestOrder: {
                'displayOrder': 'ASC'
            }
        },
        [SelectItemTypeEnum.DISPATCH_NUMBER]: {
            label: 'number',
            valueField: 'number',
            templateIndex: 'default',
            databaseTable: 'dispatch',
            placeholder: 'Sélectionnez un acheminement',
        },
        [SelectItemTypeEnum.COLLECTABLE_ARTICLES]: {
            label: 'barcode',
            valueField: 'barcode',
            templateIndex: 'collectable-articles',
            databaseTable: 'picking_article_collecte',
            placeholder: 'Sélectionnez un article',
        },
        [SelectItemTypeEnum.DISPATCH_TYPE]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'dispatch_type',
            placeholder: 'Sélectionnez un type'
        },
    }

    public constructor(private sqliteService: SqliteService,
                       private changeDetector: ChangeDetectorRef) {
        this.itemChange = new EventEmitter<any>();
        this.itemsLoaded = new EventEmitter<void>();
        this.dbItemsForList = [];
        this.dbItems = [];
        this.lastSearch = '';
    }

    private static MakeMapForInventoryLocations(anomalyMode: boolean): {[conf: string]: any; databaseTable: TableName} {
        return {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: anomalyMode ? 'anomalie_inventaire' : 'article_inventaire',
            placeholder: 'Sélectionnez un emplacement',
            map: (list: Array<ArticleInventaire>) => {
                return list
                    .reduce((acc, {location}) => ([
                        ...acc,
                        ...(acc.findIndex(({label: locationAlreadySaved}) => (locationAlreadySaved === location)) === -1
                            ? [{label: location, id: location}]
                            : [])
                    ]), []);
            }
        };
    }

    private static MakeMapForInventoryArticles(anomalyMode: boolean): {[conf: string]: any; databaseTable: TableName} {
        return {
            label: 'barcode',
            valueField: 'barcode',
            templateIndex: 'article-inventory',
            databaseTable: anomalyMode ? 'anomalie_inventaire' : 'article_inventaire',
            placeholder: 'Sélectionnez un article',
            reducer: anomalyMode
                ? (acc: Array<any>, current: any) => {
                    const {barcode: currentBarcode} = current;
                    const alreadyInsertedIndex = acc.findIndex(({barcode}) => (barcode === currentBarcode))
                    if (alreadyInsertedIndex === -1) {
                        acc.push(current);
                    }
                    return acc;
                }
                : undefined
        };
    }

    public get dbItemsLength(): number {
        return this.dbItems
            ? this.dbItems.length
            : 0;
    }

    @Input('item')
    public set item(item: any) {
        if (this._item !== item
            && (
                !this._item
                || !item
                || item.label !== this._item.label
            )) {
            if (this.isMultiple) {
                item = [item];
            }
            this._item = item;
        }
    }

    public get item(): any {
        return this._item;
    }

    public clear(): void {
        this.itemComponent.clear();
    }

    public ngOnInit(): void {
        this.itemsSubscription = this.reload().subscribe(() => {
            this.itemsLoaded.emit();
        });
    }

    public reload(): Observable<Array<any>> {
        const $res = new ReplaySubject<Array<any>>(1);
        (this.elements
            ? of(this.elements)
            : this.sqliteService.findBy(this.config[this.type].databaseTable, this.requestParams, (this.config[this.type] as any).requestOrder || {}))
            .pipe(
                take(1),
                map((list) => {
                    const {map} = this.config[this.smartType] as {map: any};
                    return map
                        ? map(list)
                        : list;
                }),
                tap((list) => {
                    if (this.config[this.smartType].reducer) {
                        list = list.reduce(this.config[this.smartType].reducer, []);
                    }

                    this.dbItems = list;

                    this.loadFirstItems();
                })
            )
            // fix reload call withoyt subscribing
            .subscribe(
                (list) => { $res.next(list); },
                (error) => { $res.error(error); },
                () => { $res.complete(); }
            );
        return $res;
    }

    public ngOnDestroy(): void {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = undefined;
        }
    }

    public loadMore(search?: string): void {
        const beginIndex = this.dbItemsForList.length;
        const endIndex = this.dbItemsForList.length + SearchItemComponent.LENGTH_TO_LOAD;

        const filter = search || this.lastSearch;

        this.dbItemsForList.push(
            ...this
                .itemFiltered(filter)
                .slice(beginIndex, endIndex)
        );
    }

    public onItemChange(value: { value: any }): void {
        this.item = value.value;
        this.itemChange.emit(this.item);
    }

    public onItemSearch({text}: { text: string }): void {
        this.itemComponent.showLoading();
        this.changeDetector.detectChanges();

        this.clearItemForList();
        this.applySearch(text);

        this.itemComponent.hideLoading();
        this.changeDetector.detectChanges();
    }

    public onInfiniteScroll(): void {
        this.itemComponent.showLoading();

        if (this.dbItemsForList.length === this.dbItems.length) {
            this.itemComponent.disableInfiniteScroll();
        }
        else {
            this.loadMore();
        }
        this.itemComponent.endInfiniteScroll();
        this.itemComponent.hideLoading();
    }

    public findItem(search: string|number, searchAttribute: string = this.config[this.type].label): any {
        return this.dbItems
            ? this.dbItems.find((element) => (String(element[searchAttribute]).trim() === String(search).trim()))
            : undefined;
    }

    public get smartType(): string|number {
        return this.type || 'default';
    }

    private applySearch(text: string = ''): void {
        if (text) {
            const trimmedText = text.trim();
            if (trimmedText) {
                if (trimmedText.length > 2) {
                    this.loadFirstItems(text);
                    this.lastSearch = text ? trimmedText : '';
                }
            }
            else {
                this.lastSearch = '';
                this.loadFirstItems();
            }
        }
        else {
            this.lastSearch = '';
            this.loadFirstItems();
        }
    }

    private clearItemForList(): void {
        this.dbItemsForList.splice(0, this.dbItemsForList.length)
    }

    private loadFirstItems(search?: string): void {
        this.clearItemForList();
        this.loadMore(search);
    }

    private itemFiltered(search: string): Array<any> {
        return search || this.filterItem
            ? this.dbItems.filter((item) => (
                (
                    !search
                    || (item.label || item.username || '').toLowerCase().includes(search.toLowerCase())
                )
                && (
                    !this.filterItem
                    || this.filterItem(item)
                )
            ))
            : this.dbItems;
    }
}
