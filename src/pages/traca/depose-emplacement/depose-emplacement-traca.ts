import {Component} from '@angular/core';
import {App, IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {Article} from "../../../app/entities/article";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {DeposeArticlesPageTraca} from "../depose-articles/depose-articles-traca";
import {Subscription} from "rxjs";
import {ZebraBarcodeScannerService} from "../../../app/services/zebra-barcode-scanner.service";

@IonicPage()
@Component({
    selector: 'depose-prise',
    templateUrl: 'depose-emplacement-traca.html',
})
export class DeposeEmplacementPageTraca {

    emplacement: Emplacement;
    // locationLabel = '';
    db_locations: Array<Emplacement>;
    db_articles: Array<Article>;

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public app: App,
                       public sqliteProvider: SqliteProvider,
                       private barcodeScanner: BarcodeScanner,
                       private changeDetectorRef: ChangeDetectorRef,
                       public toastController: ToastController,
                       private zebraBarcodeScannerService: ZebraBarcodeScannerService) {

        if (navParams.get('selectedEmplacement') !== undefined) {
            this.emplacement = navParams.get('selectedEmplacement');
        }
        this.sqliteProvider.findAll('emplacement').then((value) => {
            this.db_locations = value;
            this.sqliteProvider.findAll('article').then((value) => {
                this.db_articles = value;
            })
        });
    }

    public ionViewDidLoad(): void {
        this.zebraScannerSubscription = this.zebraBarcodeScannerService.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewDidLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    goToArticles() {
        console.log(this.emplacement);
        this.navCtrl.push(DeposeArticlesPageTraca, {emplacement: this.emplacement});
    }

    emplacementChange(event: { component: IonicSelectableComponent, value: any }) {
        this.emplacement = event.value;
        console.log(this.emplacement);
    }

    searchEmplacement(event: { component: IonicSelectableComponent, text: string }) {
        let text = event.text.trim();
        event.component.startSearch();
        event.component.items = this.sqliteProvider.findByElement('emplacement', 'label', text);
        event.component.endSearch();
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
        let instance = this;
        this.sqliteProvider.findAll('`emplacement`').then(resp => {
            let found = false;
            resp.forEach(function(element) {
                if (element.label === text) {
                    found = true;
                    instance.navCtrl.push(DeposeEmplacementPageTraca, {selectedEmplacement: element});
                    instance.changeDetectorRef.detectChanges();
                }
            });
            if (!found) {
                this.showToast('Veuillez flasher ou séléctionner un emplacement connu.');
            }
        });
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

}
