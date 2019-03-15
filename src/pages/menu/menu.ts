import { Component } from '@angular/core';
import { App, NavController, NavParams } from 'ionic-angular';
import {StockageMenuPage} from "../stockage/stockage-menu/stockage-menu";
import {Page} from "ionic-angular/navigation/nav-util";

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html'
})
export class MenuPage {
  items: Array<{title: string, icon: string, page: Page}>;

  constructor(public app: App, public navCtrl: NavController, public navParams: NavParams) {

    this.items = [
      {title: 'Stockage', icon: 'flask', page: StockageMenuPage},
      {title: 'Préparations', icon: 'wifi', page: StockageMenuPage},
      {title: 'Collectes', icon: 'beer', page: StockageMenuPage},
      {title: 'Livraisons', icon: 'paper-plane', page: StockageMenuPage},
      {title: 'Inventaire', icon: 'boat', page: StockageMenuPage}
      ];
  }

  itemTapped(event, item) {
    this.navCtrl.push(item.page);
  }

}
