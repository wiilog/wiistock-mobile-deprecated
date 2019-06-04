import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Mouvement } from "../../../app/entities/mouvement";
import { MenuPage } from "../../menu/menu";
import { PriseEmplacementPageTraca } from "../prise-emplacement/prise-emplacement-traca";
import {DeposeEmplacementPageTraca} from "../depose-emplacement/depose-emplacement-traca";
import {} from ''
import {SqliteProvider} from "../../../providers/sqlite/sqlite";


@Component({
  selector: 'page-stockage-menu',
  templateUrl: 'stockage-menu-traca.html',
})
export class StockageMenuPageTraca {
  mvts: Mouvement[];

  constructor(public navCtrl: NavController, public navParams: NavParams, sqlProvider : SqliteProvider ) {
    this.mvts = sqlProvider.findAll('`mouvement_traca`');
  }

  goToPrise() {
    this.navCtrl.push(PriseEmplacementPageTraca);
  }

  goToDepose() {
    this.navCtrl.push(DeposeEmplacementPageTraca); //TODO CG
  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

}
