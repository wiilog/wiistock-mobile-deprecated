import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TransfertRecapitulatifPage } from '../transfert-recapitulatif/transfert-recapitulatif';
import { TransfertFlashPage } from '../transfert-flash/transfert-flash';

/**
 * Generated class for the TransfertAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-transfert-add',
  templateUrl: 'transfert-add.html',
})
export class TransfertAddPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransfertAddPage');
  }

  openPage() {
  	this.navCtrl.push(TransfertRecapitulatifPage);
  }

  openLoop() {
  	this.navCtrl.push(TransfertFlashPage);
  }

}
