import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {LivraisonArticlesPage} from '@pages/stock/livraison/livraison-articles/livraison-articles';
import {Livraison} from '@app/entities/livraison';


@IonicPage()
@Component({
    selector: 'page-livraison-menu',
    templateUrl: 'livraison-menu.html',
})
export class LivraisonMenuPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild(Content)
    public content: Content;

    public livraisons: Array<Livraison>;

    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`livraison`').subscribe((livraisons) => {
            this.livraisons = livraisons.filter(l => l.date_end === null);
            this.hasLoaded = true;
            this.content.resize();
        });
    }

    public goToLivraison(livraison): void {
        this.navCtrl.push(LivraisonArticlesPage, {livraison});
    }
}
