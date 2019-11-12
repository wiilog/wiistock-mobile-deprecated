import {ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Emplacement} from '@app/entities/emplacement';
import {IonicSelectableComponent} from 'ionic-selectable';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from "@app/services/toast.service";

@Component({
    selector: 'wii-search-location',
    templateUrl: 'search-location.component.html'
})
export class SearchLocationComponent implements OnInit {

    private static readonly LENGTH_TO_LOAD: number = 30;

    public _location: Emplacement;

    @Output()
    public locationChange: EventEmitter<Emplacement>;

    @ViewChild('locationComponent')
    public locationComponent: IonicSelectableComponent;

    public dbLocationsForList: Array<Emplacement>;
    private dbLocations: Array<Emplacement>;

    private lastSearch: string;

    public constructor(private sqliteProvider: SqliteProvider,
                       private changeDetector: ChangeDetectorRef,
                       private toastService: ToastService) {
        this.locationChange = new EventEmitter<Emplacement>();
        this.dbLocationsForList = [];
        this.dbLocations = [];
        this.lastSearch = '';
    }

    @Input('location')
    public set location(location: Emplacement) {
        if (this._location !== location && (
                !this._location ||
                !location ||
                location.label !== this._location.label)) {
            this._location = location;
        }
    }

    public get location(): Emplacement {
        return this._location;
    }

    public ngOnInit(): void {
        this.sqliteProvider.findAll('emplacement').subscribe((list) => {
            this.dbLocations = list;
            this.loadFirstLocations();
        });
    }

    public loadMoreLocations(search?: string): void {
        const beginIndex = this.dbLocationsForList.length;
        const endIndex = this.dbLocationsForList.length + SearchLocationComponent.LENGTH_TO_LOAD;

        const filter = search || this.lastSearch;

        this.dbLocationsForList.push(
            ...this
                .locationFiltered(filter)
                .slice(beginIndex, endIndex)
        );
    }

    public onLocationChange({value}: { value: Emplacement }): void {
        this.location = value;
        this.locationChange.emit(this.location);
    }

    public onLocationSearch({text}: { text: string }): void {
        this.locationComponent.showLoading();
        this.changeDetector.detectChanges();

        this.clearLocationsForList();
        this.applySearch(text);

        this.locationComponent.hideLoading();
        this.changeDetector.detectChanges();
    }

    public onInfiniteScroll(): void {
        this.locationComponent.showLoading();

        if (this.dbLocationsForList.length === this.dbLocations.length) {
            this.locationComponent.disableInfiniteScroll();
        }
        else {
            this.loadMoreLocations();
        }
        this.locationComponent.endInfiniteScroll();
        this.locationComponent.hideLoading();
    }

    public isKnownLocation(label: string): Emplacement {
        return this.dbLocations
            ? this.dbLocations.find((element) => (element.label === label))
            : undefined;
    }

    private applySearch(text: string = ''): void {
        if (text) {
            const trimmedText = text.trim();
            if (trimmedText) {
                if (trimmedText.length > 2) {
                    this.loadFirstLocations(text);
                    this.lastSearch = text ? trimmedText : '';
                }
            }
            else {
                this.lastSearch = '';
                this.loadFirstLocations();
            }
        }
        else {
            this.lastSearch = '';
            this.loadFirstLocations();
        }
    }

    private clearLocationsForList(): void {
        this.dbLocationsForList.splice(0, this.dbLocationsForList.length)
    }

    private loadFirstLocations(search?: string): void {
        this.clearLocationsForList();
        this.loadMoreLocations(search);
    }

    private locationFiltered(search: string): Array<Emplacement> {
        return search
            ? this.dbLocations.filter((location) => location.label.toLowerCase().includes(search.toLowerCase()))
            : this.dbLocations;
    }
}
