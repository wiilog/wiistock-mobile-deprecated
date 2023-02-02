import {Component, ViewChild} from '@angular/core';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {IconConfig} from "@app/common/components/panel/model/icon-config";


@Component({
    selector: 'wii-inventory-mission-zone-controle',
    templateUrl: './inventory-mission-zone-controle.page.html',
    styleUrls: ['./inventory-mission-zone-controle.page.scss'],
})
export class InventoryMissionZoneControlePage extends PageComponent implements CanLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public zoneLabel: string;
    public headerConfig?: {
        rightIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.zoneLabel = this.currentNavParams.get('zoneLabel');
        this.initZoneControleView();
    }

    public ionViewWillLeave(): void {

    }

    public wiiCanLeave(): boolean {
        return true;
    }

    public initZoneControleView() {
        this.headerConfig = {
            rightIcon: {
                name: 'transfer.svg',
                color: 'tertiary',
                action: () => {
                    console.log('PLAY');
                }
            },
            title: this.zoneLabel,
            subtitle: `0 objet scanné`
        }
    }
}
