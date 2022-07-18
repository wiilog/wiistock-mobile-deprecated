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
import {tap} from 'rxjs/operators';
import {Observable, of, ReplaySubject, Subscription, zip} from 'rxjs';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {TabConfig} from '@app/common/components/tab/tab-config';
import {ArticleInventaire} from '@entities/article-inventaire';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import * as moment from 'moment';
import {Anomalie} from '@entities/anomalie';

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
    public anomalyMode: boolean;

    public tabConfig: TabConfig[] = [
        { label: 'Emplacements', key: PageMode.LOCATIONS },
        { label: 'Missions', key: PageMode.MISSIONS }
    ];

    public locationsListItemBody: Array<ListPanelItemConfig>;
    public missionsListItemBody: Array<ListPanelItemConfig>;

    public missionFilter: number;

    public isInventoryManager: boolean;

    public readonly scannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public selectItemType: SelectItemTypeEnum;
    public requestParams: Array<string> = [];

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

        const missionFilter = this.currentNavParams.get('mission');
        this.anomalyMode = this.currentNavParams.get('anomaly') || false;
        this.selectItemType = !this.anomalyMode ? SelectItemTypeEnum.INVENTORY_LOCATION : SelectItemTypeEnum.INVENTORY_ANOMALIES_LOCATION;
        if (missionFilter) {
            this.missionFilter = missionFilter;
        }

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
        this.navService.push(NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES, {
            anomaly: true
        });
    }

    private navigateToArticles(selectedLocation: string, missionId?: number): void {
        this.selectItemComponent.closeSearch();
        this.navService.push(NavPathEnum.INVENTORY_ARTICLES, {
            selectedLocation,
            mission: missionId,
            anomalyMode: this.anomalyMode || false
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

        this.requestParams = [];
        if (this.missionFilter) {
            this.requestParams.push(`mission_id = ${this.missionFilter}`)
        }


        zip(
            this.sqliteService.findBy(this.anomalyMode ? 'anomalie_inventaire' : 'article_inventaire'),
            this.selectItemComponent
                ? this.selectItemComponent.searchComponent.reload()
                : of(undefined)
        )
            .subscribe(
                ([inventoryArticles]: [Array<ArticleInventaire|Anomalie>, any]) => {
                    if (this.currentPageMode === PageMode.LOCATIONS) {
                        this.missionsListItemBody = [];
                        this.locationsListItemBody = inventoryArticles
                            .filter(({location, mission_id}, index) => (
                                (!this.missionFilter || (mission_id === this.missionFilter))
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
                                        this.selectLocation({label: location}, this.missionFilter);
                                    }
                                }
                            }));
                    }
                    else { // if (this.currentPageMode === PageMode.MISSIONS) {
                        this.locationsListItemBody = [];
                        this.missionsListItemBody = inventoryArticles
                            .filter(({mission_id}, index) => inventoryArticles.findIndex(({mission_id: mission_id2}) => (mission_id2 === mission_id)) === index)
                            .map(({mission_id, mission_name, mission_start, mission_end}) => {
                                const nbRefInMission = inventoryArticles
                                    .filter(({mission_id: mission_id_art, is_ref}) => mission_id_art === mission_id && is_ref == 1)
                                    .length;
                                const nbArtInMission = inventoryArticles
                                    .filter(({mission_id: mission_id_art, is_ref}) => mission_id_art === mission_id && is_ref == 0)
                                    .length;
                                return {
                                    infos: {
                                        name_mission: {value: mission_name},
                                        date: {value: `Du ${moment(mission_start).format('DD/MM/YYYY')} au ${moment(mission_end).format('DD/MM/YYYY')}`},
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
                                            this.selectMission(mission_id);
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
