import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Emplacement} from '@entities/emplacement';


@Component({
    selector: 'wii-search-item',
    templateUrl: 'search-item.component.html',
    styleUrls: [
        './search-item.component.scss'
    ]
})
export class SearchItemComponent implements OnInit {

    private static readonly LENGTH_TO_LOAD: number = 30;

    public _item: any;

    @Input()
    public type: SelectItemTypeEnum;

    @Input()
    public requestParams?: Array<string> = [];

    @Output()
    public itemChange: EventEmitter<any>;

    @Output()
    public itemsLoaded: EventEmitter<void>;

    @ViewChild('itemComponent', {static: false})
    public itemComponent: IonicSelectableComponent;

    public dbItemsForList: Array<any>;
    private dbItems: Array<any>;

    private lastSearch: string;

    public readonly config = {
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            label: 'barcode',
            valueField: 'barcode',
            templateIndex: 'article-prepa',
            databaseTable: 'article_prepa_by_ref_article',
            placeholder: 'Sélectionner l\'article'
        },
        [SelectItemTypeEnum.LOCATION]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'emplacement',
            placeholder: 'Sélectionner un emplacement'
        },
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'default',
            databaseTable: 'demande_livraison_type',
            placeholder: 'Sélectionner un type'
        },
        [SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES]: {
            label: 'bar_code',
            valueField: 'bar_code',
            templateIndex: 'article-demande',
            databaseTable: 'demande_livraison_article',
            placeholder: 'Sélectionner un article'
        }
    }

    public constructor(private sqliteService: SqliteService,
                       private changeDetector: ChangeDetectorRef) {
        this.itemChange = new EventEmitter<any>();
        this.itemsLoaded = new EventEmitter<void>();
        this.dbItemsForList = [];
        this.dbItems = [];
        this.lastSearch = '';
    }

    @Input('item')
    public set item(item: any) {
        if (this._item !== item
            && (
                !this._item
                || !item
                || item.label !== this._item.label
            )) {
            this._item = item;
        }
    }

    public get item(): any {
        return this._item;
    }

    public ngOnInit(): void {
        this.sqliteService.findBy(this.config[this.type].databaseTable, this.requestParams).subscribe((list) => {
            this.dbItems = list;
            this.loadFirstItems();
            this.itemsLoaded.emit();
        });
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

    public onItemChange({value}: { value: Emplacement }): void {
        this.item = value;
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
            ? this.dbItems.find((element) => (element[searchAttribute] === search))
            : undefined;
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

    private itemFiltered(search: string): Array<Emplacement> {
        return search
            ? this.dbItems.filter((location) => location.label.toLowerCase().includes(search.toLowerCase()))
            : this.dbItems;
    }
}
