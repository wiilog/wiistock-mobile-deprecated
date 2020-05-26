import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Emplacement} from '@app/entities/emplacement';
import {IonicSelectableComponent} from 'ionic-selectable';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {SelectItemTypeEnum} from "@helpers/components/select-item/select-item-type.enum";


@Component({
    selector: 'wii-search-item',
    templateUrl: 'search-item.component.html'
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

    @ViewChild('itemComponent')
    public itemComponent: IonicSelectableComponent;

    public dbItemsForList: Array<any>;
    private dbItems: Array<any>;

    private lastSearch: string;

    public readonly config = {
        [SelectItemTypeEnum.ARTICLE_TO_PICK]: {
            label: 'barcode',
            valueField: 'barcode',
            templateIndex: 'article',
            databaseTable: 'article_prepa_by_ref_article',
            placeholder: 'Sélectionner l\'article'
        },
        [SelectItemTypeEnum.LOCATION]: {
            label: 'label',
            valueField: 'id',
            templateIndex: 'location',
            databaseTable: 'emplacement',
            placeholder: 'Sélectionner un emplacement'
        }
    }

    public constructor(private sqliteProvider: SqliteProvider,
                       private changeDetector: ChangeDetectorRef) {
        this.itemChange = new EventEmitter<any>();
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
        this.sqliteProvider.findBy(this.config[this.type].databaseTable, this.requestParams).subscribe((list) => {
            this.dbItems = list;
            this.loadFirstItems();
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

    public isKnownItem(search: string): any {

        return this.dbItems
            ? this.dbItems.find((element) => (element[this.config[this.type].label] === search))
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
