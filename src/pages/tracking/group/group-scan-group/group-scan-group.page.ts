import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";

@Component({
    selector: 'app-group-scan-group',
    templateUrl: './group-scan-group.page.html',
    styleUrls: ['./group-scan-group.page.scss'],
})
export class GroupScanGroupPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public listConfig: any;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    constructor(private api: ApiService, private toastService: ToastService, navService: NavService) {
        super(navService);
    }

    ionViewWillEnter() {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public onGroupScan(code: string): void {
        const options = {
            params: {code}
        };

        this.api.requestApi(ApiService.PACKS_GROUPS, options)
            .subscribe(response => {
                if(response.isPack) {
                    this.toastService.presentToast(`Le colis ${code} n'est pas un groupe`);
                } else {
                    let group = response.packGroup || {
                        code,
                        natureId: null,
                        packs: [],
                    };

                    this.navService.push(NavPathEnum.GROUP_CONTENT, {group});
                }
            })
    }

    ionViewWillLeave() {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

}
