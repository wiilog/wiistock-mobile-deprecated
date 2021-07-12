import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav/nav.service";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {LoadingService} from '@app/common/services/loading.service';
import {Subscription} from 'rxjs';

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

    private loadingSubscription: Subscription;

    public constructor(private apiService: ApiService,
                       private loadingService: LoadingService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public onGroupScan(code: string): void {
        if (!this.loadingSubscription) {
            const options = {
                params: {code}
            };

            this.loadingSubscription = this.loadingService
                .presentLoadingWhile({event: () => this.apiService.requestApi(ApiService.PACKS_GROUPS, options)})
                .subscribe(
                    (response) => {
                        this.unsubscribeLoading();
                        if (response.isPack) {
                            this.toastService.presentToast(`Le colis ${code} n'est pas un groupe`);
                        }
                        else {
                            let group = response.packGroup || {
                                code,
                                natureId: null,
                                packs: [],
                            };

                            this.navService.push(NavPathEnum.GROUP_CONTENT, {group});
                        }
                    },
                    () => {
                        this.unsubscribeLoading();
                    }
                );
        }
    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

}
