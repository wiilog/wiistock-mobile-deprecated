import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { InventoryViewPage } from '../inventory-view/inventory-view';

/**
 * Generated class for the InventoryListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-inventory-list',
  templateUrl: 'inventory-list.html',
})
export class InventoryListPage {
   public inventaires: Array<{ nom: string; type: string; date: string; percent: number }> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 11; i++) {
      this.inventaires.push({
        nom: 'Inventaire ' + i,
        type: ((Math.floor(Math.random() * 2)) == 1) ? 'Tournant' : 'Annuel',
        date: (Math.floor(Math.random() * 12) + 1) + '/' + (Math.floor(Math.random() * 30) + 1) + '/' + (Math.floor(Math.random() * 50) + 2000),
        percent: Math.floor(Math.random() * 100),
      });
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad InventoryListPage');
  }

  openPage() {
    this.navCtrl.push(InventoryViewPage);
  }
}
