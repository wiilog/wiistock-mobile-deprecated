import { Component, ViewChild, Injectable } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';

import { MenuPage } from '../pages/menu/menu';
import { ConnectPage } from "../pages/connect/connect";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import {DeposePage} from "../pages/stockage/depose/depose";
import {PriseEmplacementPage} from "../pages/stockage/prise-emplacement/prise-emplacement";
import {StockageMenuPage} from "../pages/stockage/stockage-menu/stockage-menu";


@Injectable()
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  // make ConnectPage the root (or first) page
  rootPage = ConnectPage;
  pages: Array<{title: string, component: any}>;
  homePage = MenuPage;

  constructor(
    public platform: Platform,
    public menu: MenuController,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Accueil', component: MenuPage },
      { title: 'Connexion', component: ConnectPage },
      { title: 'Stockage', component: StockageMenuPage },
      { title: 'Prise', component: PriseEmplacementPage },
      { title: 'Depose', component: DeposePage}
    ];
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
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



}
