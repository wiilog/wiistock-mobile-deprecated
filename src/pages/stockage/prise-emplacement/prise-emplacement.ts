import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams } from 'ionic-angular';
import {PriseArticlesPage} from "../prise-articles/prise-articles";
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public app: App, public sqliteProvider: SqliteProvider) {
  // constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
  //   this.scan();

    this.db_locations = this.sqliteProvider.findAll('emplacement');
  }

  // vibrate() {
  //     navigator.vibrate(3000);
  // }

  goToArticles() {
    this.sqliteProvider.findOne('emplacement', this.id).then((emplacement) => {
      this.emplacement = emplacement;
      this.navCtrl.push(PriseArticlesPage, {emplacement: this.emplacement});
    })

  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

  // scan() {
  //   this.barcodeScanner.scan().then(barcodeData => {
  //     console.log('Barcode data', barcodeData);
  //   }).catch(err => {
  //     console.log('Error', err);
  //   });
  // }

}
