import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Mouvement } from "../../../app/entities/mouvement";
import { MenuPage } from "../../menu/menu";
import { PriseEmplacementPageTraca } from "../prise-emplacement/prise-emplacement-traca";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";


@Component({
  selector: 'page-stockage-menu',
  templateUrl: 'stockage-menu-traca.html',
})
export class StockageMenuPageTraca {
  unfinishedMouvements: Mouvement[];

  constructor(public navCtrl: NavController, public navParams: NavParams, private sqliteProvider: SqliteProvider) {
    this.unfinishedMouvements = this.sqliteProvider.findByElementNull('`mouvement_traca`', 'date_depose');
  }

  goToPrise() {
    this.navCtrl.push(PriseEmplacementPageTraca);
  }

  goToDepose() {
    this.navCtrl.push(PriseEmplacementPageTraca); //TODO CG
  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

}
