import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SortieFlashPage } from '../sortie-flash/sortie-flash';
import { SortieRecapitulatifPage } from '../sortie-recapitulatif/sortie-recapitulatif';

/**
 * Generated class for the SortieAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-sortie-add',
  templateUrl: 'sortie-add.html',
})
export class SortieAddPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SortieAddPage');
  }

  openPage() {
  	this.navCtrl.push(SortieRecapitulatifPage);
  }

  openLoop() {
  	this.navCtrl.push(SortieFlashPage);
  }
}
