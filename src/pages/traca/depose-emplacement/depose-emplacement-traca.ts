import {Component} from '@angular/core';
import {App, IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {Article} from "../../../app/entities/article";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {ChangeDetectorRef} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {DeposeArticlesPageTraca} from "../depose-articles/depose-articles-traca";
import {BarcodeScannerManagerService} from "../../../app/services/barcode-scanner-manager.service";

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
    public canGoBackService = true;

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public app: App,
                public sqliteProvider: SqliteProvider,
                public barcodeScannerManager: BarcodeScannerManagerService,
                private changeDetectorRef: ChangeDetectorRef,
                public toastController: ToastController) {
        if (navParams.get('selectedEmplacement') !== undefined) {
            this.emplacement = navParams.get('selectedEmplacement');
        }
        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
            this.sqliteProvider.findAll('article').subscribe((value) => {
                this.db_articles = value;
            })
        });
        let instance = this;
        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: [
                    'io.ionic.starter.ACTION'
                ],
                filterCategories: [
                    'android.intent.category.DEFAULT'
                ]
            },
            function (intent) {
                instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string'])
            });
    }

    goToArticles() {
        this.navCtrl.push(DeposeArticlesPageTraca, {emplacement: this.emplacement});
    }

    emplacementChange(event: { component: IonicSelectableComponent, value: any }) {
        this.emplacement = event.value;
    }

    searchEmplacement(event: { component: IonicSelectableComponent, text: string }) {
        let text = event.text.trim();
        event.component.startSearch();
        this.sqliteProvider.findByElement('emplacement', 'label', text).subscribe((items) => {
            event.component.items = items;
            event.component.endSearch();
        });
    }

    ionViewCanLeave() {
        return this.barcodeScannerManager.canGoBack;
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    scanLocation() {
        this.barcodeScannerManager.scan().subscribe((barcode) => this.testIfBarcodeEquals(barcode));
    }

    testIfBarcodeEquals(text) {
        this.sqliteProvider.findAll('`emplacement`').subscribe(resp => {
            if (resp.some(element => element.label === text)) {
                let emplacement = resp.find(element => element.label === text);
                this.navCtrl.push(DeposeEmplacementPageTraca, {selectedEmplacement: emplacement});
                this.changeDetectorRef.detectChanges();
            } else {
                this.showToast('Veuillez flasher ou sélectionner un emplacement connu.');
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
