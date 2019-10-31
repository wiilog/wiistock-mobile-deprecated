import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController} from 'ionic-angular';
import {Manutention} from '@app/entities/manutention';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MenuPage} from '@pages/menu/menu';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';

/**
 * Generated class for the ManutentionMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-manutention-menu',
    templateUrl: 'manutention-menu.html',
})
export class ManutentionMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    manutentions: Array<Manutention>;
    hasLoaded: boolean;
    user: string;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewWillEnter() {
        this.synchronise(true);
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`manutention`').subscribe((manutentions) => {
            this.manutentions = manutentions;
            this.sqliteProvider.getOperateur().then((userName) => {
                this.user = userName;
                this.hasLoaded = true;
                this.content.resize();
            });
        });
    }

    goToManut(manutention: Manutention) {
        this.navCtrl.push(ManutentionValidatePage, {manutention: manutention});
    }

    toDate(manutention: Manutention) {
        return new Date(manutention.date_attendue);
    }

    escapeQuotes(string) {
        return string.replace(/'/g, "\''");
    }

}
