import {Component, ViewChild} from '@angular/core';
import {App, NavController, NavParams, Slides} from 'ionic-angular';
import {StockageMenuPageTraca} from "../traca/stockage-menu/stockage-menu-traca"
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from "../preparation/preparation-menu/preparation-menu";
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {Preparation} from "../../app/entities/preparation";

@Component({
    selector: 'page-menu',
    templateUrl: 'menu.html'
})
export class MenuPage {
    @ViewChild(Slides) slides: Slides;
    items: Array<{ title: string, icon: string, page: Page }>;
    nbPrep: number;
    nbPrepT: number;

    constructor(public app: App, public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider) {

        this.items = [
            {title: 'Traça', icon: 'cube', page: StockageMenuPageTraca},
            {title: 'Préparation', icon: 'cube', page: PreparationMenuPage}
        ];
        this.sqliteProvider.findAll('`preparation`').then((preparations: Array<Preparation>) => {
            this.nbPrep = preparations.filter(p => p.date_end === null).length;
            this.sqliteProvider.getFinishedPreps().then((preps) => {
                this.nbPrepT = preps;
            });
        })

    }

    itemTapped(event, item) {
        this.navCtrl.push(item.page);
    }

}
