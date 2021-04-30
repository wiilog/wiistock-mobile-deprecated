import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {flatMap, map, tap} from 'rxjs/operators';
import {from, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {Emplacement} from '@entities/emplacement';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-inventory-locations',
    templateUrl: './inventory-locations.page.html',
    styleUrls: ['./inventory-locations.page.scss'],
})
export class InventoryLocationsPage extends PageComponent implements CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public isInventoryManager: boolean;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.INVENTORY_LOCATION;

    public resetEmitter$: ReplaySubject<void>;

    public dataSubscription: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new ReplaySubject<void>(1);
    }

    public ionViewWillEnter(): void {
        this.resetEmitter$.next();
        if (!this.dataSubscription) {
            this.dataSubscription = zip(
                this.loadingService.presentLoading('Chargement...'),
                this.storageService.getInventoryManagerRight()
            )
                .pipe(
                    map(([loader, isInventoryManager]) => ({loader, isInventoryManager})),
                    flatMap((data) => (
                        (this.selectItemComponent
                            ? this.selectItemComponent.searchComponent.reload()
                            : of(undefined)).pipe(map(() => data))
                    )),
                    tap(({isInventoryManager}) => {
                        this.isInventoryManager = isInventoryManager;

                        const locationsLength = this.selectItemComponent.dbItemsLength;
                        this.mainHeaderService.emitSubTitle(
                            locationsLength > 0
                            ? `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`
                            : 'Tous les inventaires sont à jour'
                        );
                    }),
                    flatMap(({loader}) => from(loader.dismiss()))
                )
                .subscribe(() => {
                    this.unsubscribeData();
                });
        }
        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.resetEmitter$.next();
        this.unsubscribeData();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public wiiCanLeave(): boolean {
        return !this.dataSubscription;
    }

    public selectLocation({label}: Emplacement): void {
        this.resetEmitter$.next();
        this.navigateToArticles(label);
    }

    public navigateToAnomalies(): void {
        this.navService.push(NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES);
    }

    private navigateToArticles(selectedLocation: string): void {
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_ARTICLES, {
            selectedLocation,
            anomalyMode: false
        });
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }
}
