import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ToastService} from '@app/services/toast.service';
import {Emplacement} from '@app/entities/emplacement';
import {NewEmplacementComponent} from '@pages/new-emplacement/new-emplacement';
import {DeposePage} from '@pages/prise-depose/depose/depose';
import {PrisePage} from '@pages/prise-depose/prise/prise';
import {Network} from '@ionic-native/network';
import {SelectLocationComponent} from "@helpers/components/select-location/select-location.component";
import {BarcodeScannerModeEnum} from "@helpers/components/barcode-scanner/barcode-scanner-mode.enum";


@IonicPage()
@Component({
    selector: 'page-emplacement-scan',
    templateUrl: 'emplacement-scan.html',
})
export class EmplacementScanPage {
    @ViewChild('selectLocationComponent')
    public selectLocationComponent: SelectLocationComponent;

    public fromDepose: boolean;
    public fromStock: boolean;

    public barcodeScannerMode: BarcodeScannerModeEnum;

    public emplacement: Emplacement;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private network: Network,
                       private toastService: ToastService) {

    }

    public ionViewWillEnter(): void {
        this.emplacement = undefined;
        this.fromDepose = this.navParams.get('fromDepose');
        this.fromStock = this.navParams.get('fromStock');

        this.barcodeScannerMode = this.fromStock
            ? BarcodeScannerModeEnum.TOOL_SEARCH
            : BarcodeScannerModeEnum.TOOLS_FULL;

        if (this.selectLocationComponent) {
            this.selectLocationComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectLocationComponent) {
            this.selectLocationComponent.unsubscribeZebraScan();
        }
    }

    public ionViewCanLeave(): boolean {
        return !this.selectLocationComponent || !this.selectLocationComponent.isScanning;
    }

    public createEmp(): void {
        this.testNetwork(() => {
            this.navCtrl.push(NewEmplacementComponent, {
                fromDepose: this.fromDepose,
                createNewEmp: (emplacement: Emplacement) => {
                    this.selectLocation(emplacement)
                }
            });
        });
    }

    private selectLocation(emplacement: Emplacement) {
        this.testNetwork(() => {
            this.emplacement = emplacement;
            this.navCtrl.push(this.fromDepose ? DeposePage : PrisePage, {
                emplacement: emplacement,
                fromStock: this.fromStock,
                finishAction: () => {
                    this.navCtrl.pop();
                }
            });
        });
    }

    private testNetwork(callback: () => void): void {
        if (!this.fromStock || this.network.type !== 'none') {
            callback();
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un transfert de stock');
        }
    }
}
