import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Preparation} from '@app/entities/preparation';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {PreparationArticlesPage} from '@pages/preparation/preparation-articles/preparation-articles';


@IonicPage()
@Component({
    selector: 'page-preparation-menu',
    templateUrl: 'preparation-menu.html',
})
export class PreparationMenuPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild(Content)
    public content: Content;

    public preparations: Array<Preparation>;
    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private sqlLiteProvider: SqliteProvider) {
    }

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public ionViewDidEnter(): void {
        this.hasLoaded = false;
        this.sqlLiteProvider.findAll('`preparation`').subscribe((preparations) => {
            this.preparations = preparations
                .filter(p => (p.date_end === null))
                .sort(({type : type1}, {type : type2}) => (type1 > type2) ? 1 : ((type2 > type1) ? -1 : 0));
            this.hasLoaded = true;
            this.content.resize();
        })
    }

    public goToArticles(preparation): void {
        this.navCtrl.push(PreparationArticlesPage, {preparation: preparation});
    }
}
