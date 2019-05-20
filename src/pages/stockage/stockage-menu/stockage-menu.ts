import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Mouvement } from "../../../app/entities/mouvement";
import {MenuPage} from "../../menu/menu";
import {PriseEmplacementPage} from "../prise-emplacement/prise-emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {Prise} from "../../../app/entities/prise";


@Component({
  selector: 'page-stockage-menu',
  templateUrl: 'stockage-menu.html',
})
export class StockageMenuPage {
  mouvements: Mouvement[];
  prises: Prise[];
  openedMouvements: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, private sqliteProvider: SqliteProvider) {
    this.displayMouvements();
  }

  displayMouvements() {
    this.sqliteProvider.count('prise')
        .then((count) => {
          this.openedMouvements = count > 0;
        });
  }

  goToPrise() {
    this.navCtrl.push(PriseEmplacementPage);
  }

  goToDepose() {
    this.navCtrl.push(PriseEmplacementPage); //TODO CG
  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

}
