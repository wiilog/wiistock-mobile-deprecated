import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PreparationRecapitulatifPage } from '../preparation-recapitulatif/preparation-recapitulatif';
import { PreparationFlashPage } from '../preparation-flash/preparation-flash';

/**
 * Generated class for the PreparationAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-preparation-add',
  templateUrl: 'preparation-add.html',
})
export class PreparationAddPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PreparationAddPage');
  }

  openPage() {
  	this.navCtrl.push(PreparationRecapitulatifPage);
  }

  openLoop() {
  	this.navCtrl.push(PreparationFlashPage);
  }
}
