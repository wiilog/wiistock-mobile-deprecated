import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {flatMap, map, tap} from 'rxjs/operators';
import {from, Observable, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {Emplacement} from '@entities/emplacement';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {TabConfig} from '@app/common/components/tab/tab-config';
import {ArticleInventaire} from '@entities/article-inventaire';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import * as moment from 'moment';

enum PageMode {
    LOCATIONS,
    MISSIONS,
}

@Component({
    selector: 'wii-inventory-locations',
    templateUrl: './inventory-locations.page.html',
    styleUrls: ['./inventory-locations.page.scss'],
})
export class InventoryLocationsPage extends PageComponent implements CanLeave {

    public readonly PageMode = PageMode;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public currentPageMode: PageMode = PageMode.LOCATIONS;

    public tabConfig: TabConfig[] = [
        { label: 'Emplacements', key: PageMode.LOCATIONS },
        { label: 'Missions', key: PageMode.MISSIONS }
    ];

    public locationsListItemBody: Array<ListPanelItemConfig>;
    public missionsListItemBody: Array<ListPanelItemConfig>;
    public missionFilter: number;

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
        this.missionFilter = undefined;
        this.resetEmitter$.next();
        if (!this.dataSubscription) {
            this.resetPageMode();
            this.dataSubscription = this.loadingService
                .presentLoadingWhile({
                    event: () => zip(
                        this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY_MANAGER),
                        this.reloadPage()
                    )
                        .pipe(
                            tap(([isInventoryManager]: [boolean, void]) => {
                                this.isInventoryManager = isInventoryManager;

                                const locationsLength = this.selectItemComponent.dbItemsLength;
                                this.mainHeaderService.emitSubTitle(
                                    locationsLength > 0
                                        ? `${locationsLength} emplacement${locationsLength > 1 ? 's' : ''}`
                                        : 'Tous les inventaires sont à jour'
                                );
                            })
                        )
                })
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

    public selectLocation({label}, missionId?: number): void {
        this.resetEmitter$.next();
        this.navigateToArticles(label, missionId);
    }

    public selectMission(missionId: number): void {
        this.missionFilter = missionId;
        this.currentPageMode = PageMode.LOCATIONS;
        this.reloadPage();
    }

    public navigateToAnomalies(): void {
        this.navService.push(NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES);
    }

    private navigateToArticles(selectedLocation: string, missionId?: number): void {
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_ARTICLES, {
            selectedLocation,
            mission: missionId,
            anomalyMode: false
        });
    }

    private unsubscribeData(): void {
        if (this.dataSubscription) {
            this.dataSubscription.unsubscribe();
            this.dataSubscription = undefined;
        }
    }

    public resetPageMode(): void {
        this.currentPageMode = PageMode.LOCATIONS;
    }

    public reloadPage(): Observable<void> {
        const res = new ReplaySubject<void>();
        zip(
            this.sqliteService.findBy('article_inventaire'),
            this.selectItemComponent
                ? this.selectItemComponent.searchComponent.reload()
                : of(undefined)
        )
            .subscribe(
                ([inventoryArticles]: [Array<ArticleInventaire>, any]) => {
                    if (this.currentPageMode === PageMode.LOCATIONS) {
                        this.missionsListItemBody = [];
                        this.locationsListItemBody = inventoryArticles
                            .filter(({location, id_mission}, index) => (
                                (!this.missionFilter || (id_mission === this.missionFilter))
                                && inventoryArticles.findIndex(({location: location2}) => (location2 === location)) === index
                            ))
                            .map(({location}) => ({
                                infos: {
                                    label: {value: location}
                                },
                                rightIcon: {
                                    color: 'primary',
                                    name: 'arrow-right.svg',
                                    action: () => {
                                        // TODO add mission filter
                                        this.selectLocation({label: location});
                                    }
                                }
                            }));
                    }
                    else { // if (this.currentPageMode === PageMode.MISSIONS) {
                        this.locationsListItemBody = [];
                        this.missionsListItemBody = inventoryArticles
                            .filter(({id_mission}, index) => inventoryArticles.findIndex(({id_mission: id_mission2}) => (id_mission2 === id_mission)) === index)
                            .map(({id_mission, name_mission, start_mission, end_mission}) => {
                                const nbRefInMission = inventoryArticles
                                    .filter(({id_mission: id_mission_art, is_ref}) => id_mission_art === id_mission && is_ref == 1)
                                    .length;
                                const nbArtInMission = inventoryArticles
                                    .filter(({id_mission: id_mission_art, is_ref}) => id_mission_art === id_mission && is_ref == 0)
                                    .length;
                                return {
                                    infos: {
                                        name_mission: {value: name_mission},
                                        date: {value: `Du ${moment(start_mission).format('DD/MM/YYYY')} au ${moment(end_mission).format('DD/MM/YYYY')}`},
                                        toto: {
                                            value: `
                                                ${nbRefInMission} référence${nbRefInMission > 1 ? 's' : ''},
                                                ${nbArtInMission} article${nbArtInMission > 1 ? 's' : ''}
                                            `
                                        }
                                    },
                                    rightIcon: {
                                        color: 'primary',
                                        name: 'arrow-right.svg',
                                        action: () => {
                                            this.selectMission(id_mission);
                                        }
                                    }
                                };
                            });
                    }
                    res.next();
                },
                (err) => {
                    res.error(err);
                });
        return res;
    }
}
