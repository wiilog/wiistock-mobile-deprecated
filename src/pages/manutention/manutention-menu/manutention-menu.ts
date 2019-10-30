import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {Manutention} from "@app/entities/manutention";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {MenuPage} from "@pages/menu/menu";
import {ManutentionValidatePage} from "@pages/manutention/manutention-validate/manutention-validate";
import {ToastService} from "@app/services/toast.service";
import {Network} from "@ionic-native/network";

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
    dataApi: string = '/api/getManutentions';
    hasLoaded: boolean;
    user: string;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        private toastService: ToastService,
        public http: HttpClient,
        public network: Network
    ) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewWillEnter() {
        this.synchronise(true);
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqlLiteProvider.findAll('`manutention`').subscribe((manutentions) => {
            this.manutentions = manutentions;
            this.sqlLiteProvider.getOperateur().then((userName) => {
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
