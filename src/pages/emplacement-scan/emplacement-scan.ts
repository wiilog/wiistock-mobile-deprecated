import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {Subscription} from "rxjs";
import {SearchLocationComponent} from "@helpers/components/search-location/search-location.component";
import {ToastService} from "@app/services/toast.service";
import {Emplacement} from "@app/entities/emplacement";
import {NewEmplacementComponent} from "@pages/new-emplacement/new-emplacement";

/**
 * Generated class for the EmplacementScanPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-emplacement-scan',
    templateUrl: 'emplacement-scan.html',
})
export class EmplacementScanPage {
    public menu: string;
    private zebraScanSubscription: Subscription;
    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;
    private chooseEmp: (emplacement: Emplacement) => void;
    private fromDepose: boolean;
    private emplacement: Emplacement;
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private barcodeScannerManager: BarcodeScannerManagerService,
        private toastService: ToastService) {
    }

    ionViewWillEnter() {
        this.chooseEmp = this.navParams.get('chooseEmp');
        this.fromDepose = this.navParams.get('fromDepose');
        this.menu = this.navParams.get('menu');
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode);
        });

    }


    public ionViewWillLeave(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    private testIfBarcodeEquals(barcode): void {
        if (!this.fromDepose) {
            if (barcode) {
                this.emplacement = {
                    id: new Date().getUTCMilliseconds(),
                    label: barcode
                };
                this.chooseEmp(this.emplacement);
            }
            else {
                this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement.');
            }
        } else {
            let location = this.searchComponent.isKnownLocation(barcode);
            if (!location) {
                this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement connu.');
            } else {
                this.emplacement = location;
                this.chooseEmp(this.emplacement);
            }
        }

    }

    public scanLocation(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode)
        });
    }

    public openSearch(): void {
        this.searchComponent.locationComponent.open();
    }

    public empChanged(emplacement: Emplacement) {
        this.chooseEmp(emplacement);
    }

    public createEmp(): void {
        this.navCtrl.push(NewEmplacementComponent, {
            fromDepose: this.fromDepose,
            menu: this.menu,
            createNewEmp: (emplacement: Emplacement) => {
                this.chooseEmp(emplacement);
            }
        });
    }

}
