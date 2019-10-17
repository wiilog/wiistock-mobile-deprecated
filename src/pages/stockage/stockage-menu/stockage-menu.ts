import {Component} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {Mouvement} from "../../../app/entities/mouvement";
import {MenuPage} from "../../menu/menu";
import {PriseEmplacementPage} from "../prise-emplacement/prise-emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";


@Component({
    selector: 'page-stockage-menu',
    templateUrl: 'stockage-menu.html',
})
export class StockageMenuPage {
    public unfinishedMouvements: Mouvement[];
    public toFinish: Boolean;

    public constructor(public navCtrl: NavController, public navParams: NavParams, private sqliteProvider: SqliteProvider) {

        this.unfinishedMouvements = [];

        this.sqliteProvider.findByElementNull('`mouvement`', 'date_drop').subscribe((unfinishedMouvements: Mouvement[]) => {
            this.unfinishedMouvements = unfinishedMouvements;
        });
    }

    public goToPrise() {
        this.navCtrl.push(PriseEmplacementPage);
    }

    public goToDepose() {
        this.navCtrl.push(PriseEmplacementPage);
    }

    public goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

}
