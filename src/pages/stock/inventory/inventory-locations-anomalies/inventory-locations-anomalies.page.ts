import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {Emplacement} from '@entities/emplacement';
import {NavService} from '@app/common/services/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {from, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {flatMap, tap} from 'rxjs/operators';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-inventory-locations-anomalies',
    templateUrl: './inventory-locations-anomalies.page.html',
    styleUrls: ['./inventory-locations-anomalies.page.scss'],
})
export class InventoryLocationsAnomaliesPage extends PageComponent implements CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION;

    public resetEmitter$: ReplaySubject<void>;

    public dataSubscription: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new ReplaySubject<void>(1);
    }

    public ionViewWillEnter(): void {
        this.resetEmitter$.next();
        if (!this.dataSubscription) {
            this.dataSubscription = this.loadingService
                .presentLoading('Chargement...')
                .pipe(
                    flatMap((loader) => zip(
                        of(loader),
                        this.selectItemComponent ? this.selectItemComponent.searchComponent.reload() : of(undefined)
                    )),
                    tap(() => {
                        const locationsLength = this.selectItemComponent.dbItemsLength;
                        this.mainHeaderService.emitSubTitle(
                            locationsLength > 0
                                ? `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`
                                : 'Toutes les anomalies ont été traitées'
                        );
                    }),
                    flatMap(([loader]) => from(loader.dismiss()))
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

    public selectLocation({label: selectedLocation}: Emplacement): void {
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_ARTICLES, {
            selectedLocation,
            anomalyMode: true
        });
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }
}
