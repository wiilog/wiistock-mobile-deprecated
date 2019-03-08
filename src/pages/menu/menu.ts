import { Component } from '@angular/core';
import { App, NavController, NavParams } from 'ionic-angular';
import { SousMenuPage } from '../sous-menu/sous-menu';
import { PriseEmplacementPage } from "../stockage/prise-emplacement/prise-emplacement";
import { DeposePage } from "../stockage/depose/depose";

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html'
})
export class MenuPage {
  items: Array<{title: string, icon: string, funcs: {}[]}>;

  constructor(public app: App, public navCtrl: NavController, public navParams: NavParams) {

    this.items = [
      {title: 'Stockage', icon: 'flask', funcs: [
          {label: 'prise', page: PriseEmplacementPage, icon: 'cloud-download'},
          {label: 'dépose', page: DeposePage, icon: 'cloud-upload'}
          ]},
      {title: 'Préparations', icon: 'wifi', funcs: []},
      {title: 'Collectes', icon: 'beer', funcs: []},
      {title: 'Livraisons', icon: 'paper-plane', funcs: []},
      {title: 'Inventaire', icon: 'boat', funcs: []}
      ];
  }

  itemTapped(event, item) {
    this.navCtrl.push(SousMenuPage, {
      item: item
    });
  }

}
