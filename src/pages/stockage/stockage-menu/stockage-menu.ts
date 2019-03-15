import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Mouvement } from "../../../app/entities/mouvement";
import {StorageService} from "../../../app/services/storage.service";
import {MenuPage} from "../../menu/menu";
import {PriseEmplacementPage} from "../prise-emplacement/prise-emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";


@Component({
  selector: 'page-stockage-menu',
  templateUrl: 'stockage-menu.html',
})
export class StockageMenuPage {
  mouvements: Mouvement[];
  openedMouvements: boolean;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storageService: StorageService, private sqliteProvider: SqliteProvider) {
    this.displayMouvements();
  }

  displayMouvements() {
    this.mouvements = this.sqliteProvider.findAll('mouvement');
    this.sqliteProvider.count('mouvement', [{column: 'type', operator: '=', value: 'prise'}, {column: 'username', operator: '=', value: 'cegaz'}])
    //TODO ajouter critère pas de dépose liée + supprimer critère utilisateur ?
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
