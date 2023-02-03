import {Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {zip} from 'rxjs';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {IconColor} from "@app/common/components/icon/icon-color";
import {InventoryLocationMission} from "@entities/inventory_location_mission";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {flatMap} from "rxjs/operators";


@Component({
    selector: 'wii-inventory-mission-zones',
    templateUrl: './inventory-mission-zones.page.html',
    styleUrls: ['./inventory-mission-zones.page.scss'],
})
export class InventoryMissionZonesPage extends PageComponent implements CanLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public listBoldValues?: Array<string>;
    public requestParams;
    public listZonesConfig?: Array<ListPanelItemConfig>;
    public selectedMissionId?: number;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.selectedMissionId = this.currentNavParams.get('missionId');
        this.listZonesConfig = [];
        this.initZoneView();
    }

    public ionViewWillLeave(): void {

    }

    public wiiCanLeave(): boolean {
        return true;
    }

    public initZoneView() {
        this.listBoldValues = ['label'];
        zip(
            this.sqliteService.findBy('inventory_location_zone', [
                'mission_id = ' + this.selectedMissionId
            ]),
        ).subscribe(([inventoryMissionZones]: [Array<InventoryLocationMission>]) => {
            let arrayResult = inventoryMissionZones.reduce((acc, inventoryMissionZone: InventoryLocationMission) => {
                if(acc[inventoryMissionZone.zone_label]){
                    acc[inventoryMissionZone.zone_label]['counter']++;
                    if(!Boolean(inventoryMissionZone.done)){
                        acc[inventoryMissionZone.zone_label]['done'] = Boolean(inventoryMissionZone.done);
                    }
                } else {
                    acc[inventoryMissionZone.zone_label] = {
                        zoneId: inventoryMissionZone.zone_id,
                        counter: 1,
                        done: inventoryMissionZone.done
                    };
                }
                return acc;
            }, {});

            this.listZonesConfig = Object.keys(arrayResult).map((index) => {
                return {
                    infos: {
                        label: {value: index},
                        details: {value: arrayResult[index].counter + ' emplacements à inventorier'}
                    },
                    pressAction: () => {
                        this.navService.push(NavPathEnum.INVENTORY_MISSION_ZONE_CONTROLE, {
                            zoneLabel: index,
                            zoneId: arrayResult[index].zoneId,
                            missionId: this.selectedMissionId,
                            afterValidate: (data) => {
                                this.refreshListConfig(data);
                            }

                        });
                    },
                    ...(arrayResult[index].done ? {
                        rightIcon: {
                            color: 'list-green' as IconColor,
                            name: 'check.svg',
                        }
                    } : {})
                }
            });
        });
    }

    public refreshListConfig(zoneId?: number){
        this.sqliteService.update(
            'inventory_location_zone',
            [{
                values: {
                    done: 1
                },
                where: [
                    'mission_id = ' + this.selectedMissionId,
                    'zone_id = ' + zoneId
                ],
            }]
        ).subscribe(() => {
            this.initZoneView();
        });
    }
}
