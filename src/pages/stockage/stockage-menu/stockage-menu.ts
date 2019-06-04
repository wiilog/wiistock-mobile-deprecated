import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Mouvement } from "../../../app/entities/mouvement";
import { MenuPage } from "../../menu/menu";
import { PriseEmplacementPage } from "../prise-emplacement/prise-emplacement";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of';


@Component({
  selector: 'page-stockage-menu',
  templateUrl: 'stockage-menu.html',
})
export class StockageMenuPage {
  mouvements: Mouvement[];
  mouvementsObs: Observable<Mouvement[]>;
  toFinish: Boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, private sqliteProvider: SqliteProvider) {
    this.mouvements = this.sqliteProvider.findAll('`mouvement`');
    this.mouvementsObs = Observable.of(this.mouvements);
    this.mouvementsObs.subscribe((value) => {
      this.toFinish = false;
      value.forEach((mvt) => {
        if (mvt.date_depose === null) {
          this.toFinish = true;
        }
      })
    })
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
