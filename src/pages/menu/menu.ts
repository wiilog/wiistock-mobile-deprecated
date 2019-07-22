import { Component } from '@angular/core';
import { App, NavController, NavParams } from 'ionic-angular';
import { StockageMenuPageTraca } from "../traca/stockage-menu/stockage-menu-traca"
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from "../preparation/preparation-menu/preparation-menu";

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html'
})
export class MenuPage {
  items: Array<{title: string, icon: string, page: Page}>;

  constructor(public app: App, public navCtrl: NavController, public navParams: NavParams) {

    this.items = [
      {title: 'Traça', icon: 'cube', page: StockageMenuPageTraca},
      {title: 'Préparation', icon: 'cube', page: PreparationMenuPage}
      ];
  }

  itemTapped(event, item) {
    this.navCtrl.push(item.page);
  }

}
