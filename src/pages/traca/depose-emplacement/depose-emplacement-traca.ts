import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {DeposeArticlesPageTraca} from '@pages/traca/depose-articles/depose-articles-traca';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {Subscription} from 'rxjs';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';


@IonicPage()
@Component({
    selector: 'depose-prise',
    templateUrl: 'depose-emplacement-traca.html',
})
export class DeposeEmplacementPageTraca {

    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;
    public emplacement: Emplacement;

    private zebraScanSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        })
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

    public goToArticles(): void {
        if (this.emplacement) {
            this.navCtrl.push(DeposeArticlesPageTraca, {
                emplacement: this.emplacement,
                finishDepose: () => {
                    this.navCtrl.pop();
                }
            });
        }
        else {
            this.toastService.presentToast('Veuillez sélectionner un emplacement')
        }
    }

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public scanLocation(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode)
        });
    }

    private testIfBarcodeEquals(barcode): void {
        const location = this.searchComponent.isKnownLocation(barcode);
        if (location) {
            this.emplacement = location;
        }
        else {
            this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement connu.');
        }
    }

}
