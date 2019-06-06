import {Component} from '@angular/core';
import {App, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {Article} from "../../../app/entities/article";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';
import {DeposeArticlesPageTraca} from "../depose-articles/depose-articles-traca";

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

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public app: App,
                public sqliteProvider: SqliteProvider,
                private barcodeScanner: BarcodeScanner,
                private changeDetectorRef: ChangeDetectorRef) {
        // constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
        //   this.scan();
        if (navParams.get('selectedEmplacement') !== undefined) {
            this.emplacement = navParams.get('selectedEmplacement');
        }
        this.db_locations = this.sqliteProvider.findAll('emplacement');
        this.db_articles = this.sqliteProvider.findAll('article');
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

    // vibrate() {
    //     navigator.vibrate(3000);
    // }

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
        this.navCtrl.push(MenuPage);
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
    }

    testIfBarcodeEquals(text) {
        let emplacement: Emplacement;
        emplacement = {
            id: new Date().getUTCMilliseconds(),
            label: text
        };
        this.navCtrl.push(DeposeEmplacementPageTraca, {selectedEmplacement: emplacement});
        this.changeDetectorRef.detectChanges();
    }

}
