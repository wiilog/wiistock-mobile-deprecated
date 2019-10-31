import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {LivraisonArticlesPage} from "../livraison-articles/livraison-articles";
import {Livraison} from "../../../app/entities/livraison";
import {Network} from "@ionic-native/network";

/**
 * Generated class for the LivraisonMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-menu',
    templateUrl: 'livraison-menu.html',
})
export class LivraisonMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    livraisons: Array<Livraison>;
    hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewDidEnter() {
        this.synchronise(true);
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`livraison`').subscribe((livraisons) => {
            this.livraisons = livraisons.filter(l => l.date_end === null);
            this.hasLoaded = true;
            this.content.resize();
        })
    }

    goToArticles(livraison) {
        this.navCtrl.push(LivraisonArticlesPage, {livraison: livraison});
    }

}
