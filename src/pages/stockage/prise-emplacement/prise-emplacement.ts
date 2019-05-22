import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseArticlesPage } from "../prise-articles/prise-articles";
import { MenuPage } from "../../menu/menu";
import { Emplacement } from "../../../app/entities/emplacement";
import { Article } from "../../../app/entities/article";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ChangeDetectorRef } from '@angular/core';
// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@IonicPage()
@Component({
  selector: 'page-prise',
  templateUrl: 'prise-emplacement.html',
})
export class PriseEmplacementPage {

  emplacement: Emplacement;
  id: number;
  // locationLabel = '';
  db_locations: Array<Emplacement>;
  db_articles: Array<Article>;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public app: App,
    public sqliteProvider: SqliteProvider,
    private barcodeScanner: BarcodeScanner,
    private toast: ToastController,
    private changeDetectorRef: ChangeDetectorRef) {
    // constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
    //   this.scan();
    if (navParams.get('selectedEmplacement') !== undefined) {
      this.id = navParams.get('selectedEmplacement');
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
    this.sqliteProvider.findOne('emplacement', this.id).then((emplacement) => {
      this.emplacement = emplacement;
      this.navCtrl.push(PriseArticlesPage, { emplacement: this.emplacement });
    });
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
    let found = false;
    this.db_locations.forEach(emplacement => {
      if (emplacement['label'] === text && !found) {
        this.navCtrl.push(PriseEmplacementPage, { selectedEmplacement: emplacement.id });
        found = true;
      }
    });
    if (!found) {
      this.toast.create({
        message: 'Aucun emplacement ne correspond à l\'emplacement scanné',
        duration: 3000,
        position: 'center',
        cssClass: 'toast-error'
      }).present();
    }
    this.changeDetectorRef.detectChanges();
  }

}
