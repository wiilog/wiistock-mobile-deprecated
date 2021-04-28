import {Component} from '@angular/core';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {UngroupScanLocationPageRoutingModule} from "@pages/tracking/ungroup/ungroup-scan-location/ungroup-scan-location-routing.module";
import {UngroupConfirmPageRoutingModule} from "@pages/tracking/ungroup/ungroup-confirm/ungroup-confirm-routing.module";

@Component({
    selector: 'app-ungroup-scan-group',
    templateUrl: './ungroup-scan-group.page.html',
    styleUrls: ['./ungroup-scan-group.page.scss'],
})
export class UngroupScanGroupPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    constructor(private api: ApiService, private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    public onGroupScan(code: string, _isManualAdd: boolean = false): void {
        const options = {
            params: {code}
        };

        this.api.requestApi(ApiService.PACKS_GROUPS, options)
            .subscribe(response => {
                if(response.isPack) {
                    this.toastService.presentToast(`Le colis ${code} n'est pas un groupe`);
                } else if(response.packGroup && !response.packGroup.packs.length) {
                    this.toastService.presentToast(`Le groupe ${code} ne contient aucun colis`);
                } else if(response.packGroup) {
                    this.navService.push(UngroupConfirmPageRoutingModule.PATH, {
                        location: this.currentNavParams.get(`location`),
                        group: response.packGroup
                    });
                } else {
                    this.toastService.presentToast(`Le groupe ${code} n'existe pas`)
                }
            })
    }

}
