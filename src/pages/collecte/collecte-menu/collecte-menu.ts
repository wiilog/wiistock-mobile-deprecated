import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, Platform} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {CollecteArticlesPage} from '@pages/collecte/collecte-articles/collecte-articles';
import {Collecte} from '@app/entities/collecte';


@IonicPage()
@Component({
    selector: 'page-collectes-menu',
    templateUrl: 'collecte-menu.html',
})
export class CollecteMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    collectes: Array<Collecte>;
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public platform : Platform) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewWillEnter() {
        this.synchronise(true);
        this.platform.registerBackButtonAction(_ => this.navCtrl.setRoot(MenuPage));
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqlLiteProvider.findAll('`collecte`').subscribe((collectes) => {
            this.collectes = collectes
                .filter(c => c.date_end === null)
                .sort(({emplacement: emplacement1}, {emplacement: emplacement2}) => ((emplacement1 < emplacement2) ? -1 : 1));
            this.hasLoaded = true;
            this.content.resize();
        })
    }

    goToArticles(collecte) {
        this.navCtrl.push(CollecteArticlesPage, {collecte});
    }

}
