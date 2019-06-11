import {Component, ViewChild, Injectable} from '@angular/core';
import {Platform, MenuController, Nav, Events, ToastController} from 'ionic-angular';

import {MenuPage} from '../pages/menu/menu';
import {ConnectPage} from "../pages/connect/connect";

import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {DeposePage} from "../pages/stockage/depose/depose";
import {DeposePageTraca} from "../pages/traca/depose/depose-traca";
import {PriseEmplacementPage} from "../pages/stockage/prise-emplacement/prise-emplacement";
import {StockageMenuPage} from "../pages/stockage/stockage-menu/stockage-menu";
import {NetworkProvider} from '../providers/network/network'
import {Network} from "@ionic-native/network";
import {SqliteProvider} from "../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import { StockageMenuPageTraca } from "../pages/traca/stockage-menu/stockage-menu-traca"


@Injectable()
@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    @ViewChild(Nav) nav: Nav;

    // make ConnectPage the root (or first) page
    rootPage = ConnectPage;
    pages: Array<{ title: string, component: any }>;
    homePage = MenuPage;

    constructor(
        public platform: Platform,
        public menu: MenuController,
        public statusBar: StatusBar,
        public splashScreen: SplashScreen,
        public networkProvider: NetworkProvider,
        public events: Events,
        public http: HttpClient,
        public network: Network,
        public sqlProvider: SqliteProvider,
        public toastController: ToastController,
    ) {
        this.initializeApp();

        // set our app's pages
        this.pages = [
            {title: 'Accueil', component: MenuPage},
            {title: 'Traça', component: StockageMenuPageTraca}
        ];

    }

    initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            this.statusBar.styleDefault();
            this.splashScreen.hide();
            this.networkProvider.initializeNetworkEvents();

            // Offline event
            this.events.subscribe('network:offline', () => {
                console.log('network:offline ==> ' + this.network.type);
            });

            // Online event
            this.events.subscribe('network:online', () => {
                let baseUrl: string = 'http://51.77.202.108/WiiStock-dev/public/index.php/api/addMouvementTraca';
                this.sqlProvider.findAll('`mouvement_traca`').then((value) => {
                    let toInsert = {};
                    toInsert = {
                        mouvements: value
                    };
                    this.http.post<any>(baseUrl, toInsert).subscribe((resp) => {
                        if (resp.success) {
                            this.showToast(resp.data.status);
                        }
                    });
                });
                console.log('network:online ==> ' + this.network.type);
            });
        });
    }

    openPage(page) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        this.nav.setRoot(page.component);
    }

    goHome() {
        this.nav.setRoot(this.homePage);
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }


}
