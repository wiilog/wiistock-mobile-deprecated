import {Component} from '@angular/core';
import {App, IonicPage, NavController, NavParams} from 'ionic-angular';
import {PriseArticlesPageTraca} from "../prise-articles/prise-articles-traca";
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {Article} from "../../../app/entities/article";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {ChangeDetectorRef} from '@angular/core';
import {IonicSelectableComponent} from 'ionic-selectable';

@IonicPage()
@Component({
    selector: 'page-prise',
    templateUrl: 'prise-emplacement-traca.html',
})
export class PriseEmplacementPageTraca {

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

    // vibrate() {
    //     navigator.vibrate(3000);
    // }

    goToArticles() {
        this.navCtrl.push(PriseArticlesPageTraca, {emplacement: this.emplacement});
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
        event.component.endSearch();
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    scanLocation() {
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
        this.navCtrl.push(PriseEmplacementPageTraca, {selectedEmplacement: emplacement});
        this.changeDetectorRef.detectChanges();
    }

}
