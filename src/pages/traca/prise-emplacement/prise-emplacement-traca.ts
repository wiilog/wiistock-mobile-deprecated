import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {PriseArticlesPageTraca} from '@pages/traca/prise-articles/prise-articles-traca';
import {Emplacement} from '@app/entities/emplacement';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {Subscription} from 'rxjs';
import {NewEmplacementComponent} from "@pages/new-emplacement/new-emplacement";


@IonicPage()
@Component({
    selector: 'page-prise',
    templateUrl: 'prise-emplacement-traca.html',
})
export class PriseEmplacementPageTraca {

    public emplacement: Emplacement;

    private zebraScanSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService) {}

    public ionViewWillEnter(): void {
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
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
            this.navCtrl.push(PriseArticlesPageTraca, {
                emplacement: this.emplacement,
                finishPrise: () => {
                    this.navCtrl.pop();
                }
            });
        }
        else {
            this.toastService.presentToast('Veuillez sélectionner un emplacement')
        }
    }

    goToCreateEmp(): void {
        this.navCtrl.push(NewEmplacementComponent, {
            fromDepose: false,
            menu: 'Prise',
            createNewEmp: (emplacement: Emplacement) => {
                this.emplacement = emplacement;
            }
        });
    }

    public scanLocation(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode)
        });
    }

    private testIfBarcodeEquals(barcode): void {
        if (barcode) {
            this.emplacement = {
                id: new Date().getUTCMilliseconds(),
                label: barcode
            };
        }
        else {
            this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement.');
        }
    }
}
