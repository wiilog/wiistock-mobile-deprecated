import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the ReceptionRecapitulatifPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reception-recapitulatif',
  templateUrl: 'reception-recapitulatif.html',
})
export class ReceptionRecapitulatifPage {
  public items: Array<{ title: string; button_state: boolean }> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Réception ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceptionRecapitulatifPage');
  }

  goToHome() {
    this.navCtrl.popToRoot();
  }

}
