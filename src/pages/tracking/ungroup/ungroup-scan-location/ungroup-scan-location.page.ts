import {Component, ViewChild} from '@angular/core';
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {Emplacement} from "@entities/emplacement";
import {ToastService} from "@app/common/services/toast.service";
import {StorageService} from "@app/common/services/storage/storage.service";
import {NavService} from "@app/common/services/nav/nav.service";
import {PageComponent} from "@pages/page.component";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@app/common/components/select-item/select-item.component";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {ViewWillEnter} from "@ionic/angular";
import {NetworkService} from '@app/common/services/network.service';

@Component({
    selector: 'app-ungroup-scan-location',
    templateUrl: './ungroup-scan-location.page.html',
    styleUrls: ['./ungroup-scan-location.page.scss'],
})
export class UngroupScanLocationPage extends PageComponent implements ViewWillEnter {

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;
    public readonly barcodeScannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location: Emplacement) {
        this.testNetwork(() => {
            this.navService.push(NavPathEnum.UNGROUP_SCAN_GROUP, {
                location,
                finishAction: () => {
                    this.navService.pop();
                }
            });
        });
    }

    private testNetwork(callback: () => void): void {
        if (this.networkService.hasNetwork()) {
            callback();
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un dégroupage');
        }
    }

}
