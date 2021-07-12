import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav/nav.service";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {Subscription} from 'rxjs';
import {LoadingService} from '@app/common/services/loading.service';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';

@Component({
    selector: 'app-ungroup-scan-group',
    templateUrl: './ungroup-scan-group.page.html',
    styleUrls: ['./ungroup-scan-group.page.scss'],
})
export class UngroupScanGroupPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    private loadingSubscription: Subscription;

    public constructor(private api: ApiService,
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
                .presentLoadingWhile({event: () => this.api.requestApi(ApiService.PACKS_GROUPS, options)})
                .subscribe(
                    (response) => {
                        this.unsubscribeLoading();
                        if (response.isPack) {
                            this.toastService.presentToast(`Le colis ${code} n'est pas un groupe`);
                        }
                        else if (response.packGroup && !response.packGroup.packs.length) {
                            this.toastService.presentToast(`Le groupe ${code} ne contient aucun colis`);
                        }
                        else if (response.packGroup) {
                            this.navService.push(NavPathEnum.UNGROUP_CONFIRM, {
                                location: this.currentNavParams.get(`location`),
                                group: response.packGroup
                            });
                        }
                        else {
                            this.toastService.presentToast(`Le groupe ${code} n'existe pas`)
                        }
                    },
                    () => {
                        this.unsubscribeLoading();
                    }
                )
        }
    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

}
