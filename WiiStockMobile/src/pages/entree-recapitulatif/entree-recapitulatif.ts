import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the EntreeRecapitulatifPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-entree-recapitulatif',
  templateUrl: 'entree-recapitulatif.html',
})
export class EntreeRecapitulatifPage {
  public items: Array<{ title: string; button_state: boolean }> = [];
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Entrée ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EntreeRecapitulatifPage');
  }

  goToHome() {
    this.navCtrl.popToRoot();
  }
}
