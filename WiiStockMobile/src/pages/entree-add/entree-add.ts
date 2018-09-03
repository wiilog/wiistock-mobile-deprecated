import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { EntreeFlashPage } from '../entree-flash/entree-flash';
import { EntreeRecapitulatifPage } from '../entree-recapitulatif/entree-recapitulatif';

/**
 * Generated class for the EntreeAddPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-entree-add',
  templateUrl: 'entree-add.html',
})
export class EntreeAddPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EntreeAddPage');
  }

  openPage() {
  	this.navCtrl.push(EntreeRecapitulatifPage);
  }

  openLoop() {
    this.navCtrl.push(EntreeFlashPage);
  }
}
