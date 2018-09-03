import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ReceptionRecapitulatifPage } from '../reception-recapitulatif/reception-recapitulatif';
import { ReceptionFlashPage } from '../reception-flash/reception-flash';

/**
 * Generated class for the ReceptionAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reception-add',
  templateUrl: 'reception-add.html',
})
export class ReceptionAddPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceptionAddPage');
  }

  openPage() {
  	this.navCtrl.push(ReceptionRecapitulatifPage);
  }

  openLoop() {
  	this.navCtrl.push(ReceptionFlashPage);
  }
}
