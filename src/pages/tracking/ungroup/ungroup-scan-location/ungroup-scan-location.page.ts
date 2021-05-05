import {Component, ViewChild} from '@angular/core';
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {Emplacement} from "@entities/emplacement";
import {Network} from "@ionic-native/network/ngx";
import {ToastService} from "@app/common/services/toast.service";
import {StorageService} from "@app/common/services/storage/storage.service";
import {NavService} from "@app/common/services/nav.service";
import {PageComponent} from "@pages/page.component";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@app/common/components/select-item/select-item.component";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'app-ungroup-scan-location',
    templateUrl: './ungroup-scan-location.page.html',
    styleUrls: ['./ungroup-scan-location.page.scss'],
})
export class UngroupScanLocationPage extends PageComponent {

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;
    public readonly barcodeScannerMode = BarcodeScannerModeEnum.TOOL_SEARCH;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public constructor(private network: Network,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
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
        if (this.network.type !== 'none') {
            callback();
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un dégroupage');
        }
    }

}
