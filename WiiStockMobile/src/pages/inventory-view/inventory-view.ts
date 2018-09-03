import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the InventoryViewPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-inventory-view',
  templateUrl: 'inventory-view.html',
})
export class InventoryViewPage {
   public inventaire: Array<{ nom: string; ref: string; allee: string; travee: string; rack: string;quantite: number }> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 6; i++) {
      this.inventaire.push({
        nom: 'Item ' + i,
        ref: Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10),
        allee: 'Allée ' + Math.floor(Math.random() * 10),
        travee: 'Travée ' + Math.floor(Math.random() * 20),
        rack: 'Rack ' + Math.floor(Math.random() * 30),
        quantite: 0,
      });
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad InventoryViewPage');
  }

  goToHome() {
    this.navCtrl.popToRoot();
  }

}
