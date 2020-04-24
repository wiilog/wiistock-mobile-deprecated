import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ToastService} from '@app/services/toast.service';
import {Emplacement} from '@app/entities/emplacement';
import {NewEmplacementComponent} from '@pages/new-emplacement/new-emplacement';
import {DeposePage} from '@pages/prise-depose/depose/depose';
import {PrisePage} from '@pages/prise-depose/prise/prise';
import {Network} from '@ionic-native/network';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {SelectItemComponent} from '@helpers/components/select-item/select-item.component';
import {SelectItemTypeEnum} from "@helpers/components/select-item/select-item-type.enum";


@IonicPage()
@Component({
    selector: 'page-emplacement-scan',
    templateUrl: 'emplacement-scan.html',
})
export class EmplacementScanPage {
    @ViewChild('selectItemComponent')
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public fromDepose: boolean;
    public fromStock: boolean;

    public barcodeScannerMode: BarcodeScannerModeEnum;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private network: Network,
                       private toastService: ToastService) {

    }

    public ionViewWillEnter(): void {
        this.fromDepose = this.navParams.get('fromDepose');
        this.fromStock = this.navParams.get('fromStock');

        this.barcodeScannerMode = this.fromStock
            ? BarcodeScannerModeEnum.TOOL_SEARCH
            : BarcodeScannerModeEnum.TOOLS_FULL;

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public ionViewCanLeave(): boolean {
        return !this.selectItemComponent || !this.selectItemComponent.isScanning;
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
