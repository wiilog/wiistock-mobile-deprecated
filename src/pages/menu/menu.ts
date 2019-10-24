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
import {InventaireMenuPage} from "../inventaire-menu/inventaire-menu";
import {CollecteMenuPage} from "@pages/collecte/collecte-menu/collecte-menu";

@Component({
    selector: 'page-menu',
    templateUrl: 'menu.html'
})
export class MenuPage {
    @ViewChild(Slides) slides: Slides;
    items: Array<{ title: string, icon: string, page: Page, img: string }>;
    nbPrep: number;
    nbPrepT: number;
    nbArtInvent: number;

    constructor(public app: App, public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider) {

        this.items = [
            {title: 'Traça', icon: 'cube', page: StockageMenuPageTraca, img: null},
            {title: 'Préparation', icon: 'cart', page: PreparationMenuPage, img: null},
            {title: 'Livraison', icon: 'paper-plane', page: LivraisonMenuPage, img: null},
            {title: 'Inventaire', icon: 'list-box', page: InventaireMenuPage, img: null},
            {title: 'Manutention', icon: 'list-box', page: ManutentionMenuPage, img: 'assets/icon/manut_icon.svg'},
            {title: 'Déconnexion', icon: 'log-out', page: null, img: null}
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

        this.sqliteProvider.getOperateur().then((username) => {
            console.log(username);
        })
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
