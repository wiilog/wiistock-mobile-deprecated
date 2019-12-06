import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {MenuConfig} from "@helpers/components/menu/menu-config";
import {PreparationMenuPage} from "@pages/stock/preparation/preparation-menu/preparation-menu";
import {LivraisonMenuPage} from "@pages/stock/livraison/livraison-menu/livraison-menu";
import {InventaireMenuPage} from "@pages/stock/inventaire-menu/inventaire-menu";
import {PriseDeposeMenuPage} from "@pages/prise-depose/prise-depose-menu/prise-depose-menu";


@IonicPage()
@Component({
    selector: 'page-stock-menu',
    templateUrl: 'stock-menu.html',
})
export class StockMenuPage {

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(navCtrl: NavController) {
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Transfert',
                action: () => {
                    navCtrl.push(PriseDeposeMenuPage, {
                        fromStock: true
                    });
                }
            },
            {
                icon: 'preparation.svg',
                label: 'Préparation',
                action: () => { navCtrl.push(PreparationMenuPage); }
            },
            {
                icon: 'delivery.svg',
                label: 'Livraison',
                action: () => { navCtrl.push(LivraisonMenuPage); }
            },
            {
                icon: 'collecte.svg',
                label: 'Collecte',
                action: () => { navCtrl.push(LivraisonMenuPage); }
            },
            {
                icon: 'inventary.svg',
                label: 'Inventaire',
                action: () => { navCtrl.push(InventaireMenuPage); }
            }
        ];
    }
}
