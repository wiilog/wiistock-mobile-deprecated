import {Component, ViewChild} from '@angular/core';
import {App, NavController, NavParams, Slides} from 'ionic-angular';
import {StockageMenuPageTraca} from "../traca/stockage-menu/stockage-menu-traca"
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from "../preparation/preparation-menu/preparation-menu";
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {Preparation} from "../../app/entities/preparation";
import {LivraisonMenuPage} from "../livraison/livraison-menu/livraison-menu";
import {ParamsPage} from "../params/params";
import {ConnectPage} from "../connect/connect";
import {InventaireMenuPage} from "../inventaire/inventaire-menu/inventaire-menu";

@Component({
    selector: 'page-menu',
    templateUrl: 'menu.html'
})
export class MenuPage {
    @ViewChild(Slides) slides: Slides;
    items: Array<{ title: string, icon: string, page: Page }>;
    nbPrep: number;
    nbPrepT: number;
    nbArtInvent: number;

    constructor(public app: App, public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider) {

        this.items = [
            {title: 'Traça', icon: 'cube', page: StockageMenuPageTraca},
            {title: 'Préparation', icon: 'cart', page: PreparationMenuPage},
            {title: 'Livraison', icon: 'paper-plane', page: LivraisonMenuPage},
            {title: 'Inventaire', icon: 'list-box', page: InventaireMenuPage},
            {title: 'Déconnexion', icon: 'log-out', page: null}
        ];
    }

    ionViewDidEnter() {
        this.sqliteProvider.findAll('`preparation`').subscribe((preparations: Array<Preparation>) => {
            this.nbPrep = preparations.filter(p => p.date_end === null).length;
            this.sqliteProvider.getFinishedPreps().then((preps) => {
                this.nbPrepT = preps;
            });
        });
        this.sqliteProvider.count('`article_inventaire`', []).subscribe((nbArticlesInventaire: number) => {
            this.nbArtInvent = nbArticlesInventaire;
        });
    }

    itemTapped(event, item) {
        if (item.page === null) {
            this.navCtrl.setRoot(ConnectPage);
        } else {
            this.navCtrl.setRoot(item.page);
        }
    }

    goToParams() {
        this.navCtrl.push(ParamsPage);
    }

}
