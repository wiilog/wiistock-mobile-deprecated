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
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {ApiService} from "@app/common/services/api.service";


@Component({
    selector: 'wii-inventory-mission-zone-controle',
    templateUrl: './inventory-mission-zone-controle.page.html',
    styleUrls: ['./inventory-mission-zone-controle.page.scss'],
})
export class InventoryMissionZoneControlePage extends PageComponent implements CanLeave {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean;

    public zoneLabel: string;
    public zoneId: number;
    public missionId: number;
    public rfidTags?: Array<string>;
    public inputRfidTags: Array<string>;
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        title: string;
        subtitle?: string;
    };

    public afterValidate: (data) => void;

    public elementsToDisplay: Array<{reference: string, location: string, ratio: number}>;

    public missingsRefsListConfig: {
        header: HeaderConfig;
        body?: Array<ListPanelItemConfig>;
    };

    public locationsQualityListConfig: {
        header: HeaderConfig;
        body?: Array<ListPanelItemConfig>;
    };

    public listBoldValues?: Array<string>;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.loading = false;
        this.rfidTags = [];
        this.afterValidate = this.currentNavParams.get('afterValidate');
        this.zoneLabel = this.currentNavParams.get('zoneLabel');
        this.inputRfidTags = this.currentNavParams.get('rfidTags');
        this.zoneId = this.currentNavParams.get('zoneId');
        this.missionId = this.currentNavParams.get('missionId');
        this.headerConfig = {
            leftIcon: {
                name: 'inventory.svg',
            },
            rightIcon: {
                name: 'rfid_play.svg',
                action: () => {
                    this.initZoneControleView();
                }
            },
            title: this.zoneLabel,
            subtitle: `0 objet scanné`
        };
        this.listBoldValues = ['title', 'reference', 'location', 'textRight'];
        this.elementsToDisplay = [];
    }

    public refreshHeaderConfig(): void {
        this.headerConfig.rightIcon.name =
            this.headerConfig.rightIcon.name === 'rfid_pause.svg'
            ? 'rfid_play.svg'
            : 'rfid_pause.svg';
    }

    public ionViewWillLeave(): void {

    }

    public wiiCanLeave(): boolean {
        return true;
    }

    public initZoneControleView() {
        this.refreshHeaderConfig();
        this.refreshMissingsRefsListConfig();
        this.refreshLocationsQualityListConfig();
    }

    public refreshMissingsRefsListConfig(){
        const missingsRefsToDisplay = this.elementsToDisplay.filter((missingRef) => missingRef.ratio === 0);
        const plural = missingsRefsToDisplay.length > 1 ? 's' : '';
        const msgToDisplay = `référence${plural} manquante${plural}`;

        this.missingsRefsListConfig = {
            header: {
                title: `Attention ${msgToDisplay}`,
                subtitle: `${missingsRefsToDisplay.length} ${msgToDisplay}`,
                leftIcon: {
                    name: 'emergency.svg',
                    width: '25px'
                }
            },
            body: missingsRefsToDisplay.map(({location, reference}) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference
                    },
                    location: {
                        label: 'Emplacement',
                        value: location
                    }
                },
            }))
        };
    }

    public refreshLocationsQualityListConfig(){
        const locationQualityToDisplay = this.elementsToDisplay.filter((missingRef) => missingRef.ratio > 0);
        const plural = locationQualityToDisplay.length > 1 ? 's' : '';

        this.locationsQualityListConfig = {
            header: {
                title: `Indicateur d'emplacement avant validation`,
                subtitle: `${locationQualityToDisplay.length} emplacement${plural}`,
                leftIcon: {
                    name: 'location-black.svg',
                    color: 'primary',
                    width: '25px'
                }
            },
            body: locationQualityToDisplay.map(({location, reference, ratio}) => ({
                infos: {
                    reference: {
                        label: 'Référence',
                        value: reference
                    },
                    location: {
                        label: 'Emplacement',
                        value: location
                    }
                },
                textRight: {
                    label: `${ratio}%`,
                    size: `25px`,
                }
            }))
        }
    }

    public validateInventoryMissionZoneControl(){
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.INVENTORY_MISSION_VALIDATE_ZONE, {
                    params: {
                        zone: this.zoneId,
                        mission: this.missionId,
                    }
                })
            }
        }).subscribe((response) => {
            if(response.success){
                this.navService.pop().subscribe(() => {
                    this.afterValidate({
                        zoneId: this.zoneId,
                        tags: this.inputRfidTags
                    });
                });
            }
        });
    }

    public addManualRFID(rfidTag?: string){
        if(!this.rfidTags.includes(rfidTag)){
            this.rfidTags.push(rfidTag);
            this.inputRfidTags.push(rfidTag);
        }
        this.loadingService.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.ZONE_RFID_SUMMARY, {
                    params: {
                        zone: this.zoneId,
                        mission: this.missionId,
                        rfidTags: this.rfidTags,
                    }
                })
            }
        }).subscribe((response) => {
            this.elementsToDisplay = response.data;
            this.initZoneControleView();
        });
    }
}
