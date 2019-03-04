import { Component } from '@angular/core';
import { App, NavController, NavParams } from 'ionic-angular';
import { ItemDetailsPage } from '../item-details/item-details';
import { PrisePage } from "../prise/prise";
import { DeposePage } from "../depose/depose";

@Component({
  selector: 'page-list',
  templateUrl: 'list.html'
})
export class ListPage {
  items: Array<{title: string, icon: string, funcs: {}[]}>;

  constructor(public app: App, public navCtrl: NavController, public navParams: NavParams) {

    this.items = [
      {title: 'Stockage', icon: 'flask', funcs: [
          {label: 'prise', page: PrisePage},
          {label: 'depose', page: DeposePage}
          ]},
      {title: 'Préparations', icon: 'wifi', funcs: []},
      {title: 'Collectes', icon: 'beer', funcs: []},
      {title: 'Livraisons', icon: 'paper-plane', funcs: []},
      {title: 'Inventaire', icon: 'boat', funcs: []}
      ];
  }

  itemTapped(event, item) {
    this.navCtrl.push(ItemDetailsPage, {
      item: item
    });
  }

  goToHome() {
    let nav = this.app.getRootNav();
    nav.setRoot(ListPage);
  }
}
