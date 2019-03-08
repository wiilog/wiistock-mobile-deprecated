import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams } from 'ionic-angular';
import {PriseArticlesPage} from "../prise-articles/prise-articles";
import {MenuPage} from "../../menu/menu";
// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

/**
 * Generated class for the PriseEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-prise',
  templateUrl: 'prise-emplacement.html',
})
export class PriseEmplacementPage {

  location = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, public app: App) {
  // constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
  //   this.scan();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PriseEmplacementPage');
  }

  vibrate() {
      navigator.vibrate(3000);
  }

  goToArticles() {
    // verif emplacement existe
    this.navCtrl.push(PriseArticlesPage, {location: this.location});
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
