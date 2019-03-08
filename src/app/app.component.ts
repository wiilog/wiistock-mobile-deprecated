import { Component, ViewChild, Injectable } from '@angular/core';
import { SQLite } from "@ionic-native/sqlite";
import { Storage } from '@ionic/storage';
import { Platform, MenuController, Nav } from 'ionic-angular';

import { MenuPage } from '../pages/menu/menu';
import { ConnectPage } from "../pages/connect/connect";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import {DeposePage} from "../pages/stockage/depose/depose";
import {PriseEmplacementPage} from "../pages/stockage/prise-emplacement/prise-emplacement";


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
    private sqlite: SQLite,
    private storage: Storage
  ) {
    this.initializeApp();

    // set our app's pages
    this.pages = [
      { title: 'Accueil', component: MenuPage },
      { title: 'Connexion', component: ConnectPage },
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

      // this.storage.set('name', 'Cegaz');
      // this.storage.get('name').then((val) => {
      //   console.log('your name is', val);
      // })

      // this.sqlite.create({
      //   name: 'gt_follow_stock.db',
      //   location: 'default'
      // })
      //     .then((db: SQLiteObject) => {
      //       console.log('créa table');
      //       db.executeSql('CREATE TABLE mouvements(label VARCHAR(16))', [])
      //           .then(() => console.log('Executed SQL'))
      //           .catch(e => console.log(e));
      //
      //     })
      //     .catch(e => console.log(e));
    });
  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.setRoot(page.component);
  }

  //TODO CG comment utiliser ds ttes pages ?
  goHome() {
    this.nav.setRoot(this.homePage);
  }



}
