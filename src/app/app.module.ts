import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { SQLite } from "@ionic-native/sqlite";
// import {Router, RouterModule, Routes} from '@angular/router';

import { ConnectPage } from '../pages/connect/connect';
import { MenuPage } from '../pages/menu/menu';
import { SousMenuPage } from '../pages/sous-menu/sous-menu';
import { DeposePage } from "../pages/stockage/depose/depose";
import { IonicStorageModule } from "@ionic/storage";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpClientModule } from "@angular/common/http";
import { UsersApiProvider } from '../providers/users-api/users-api';
import { PriseArticlesPage } from "../pages/stockage/prise-articles/prise-articles";
import { PriseConfirmPage } from "../pages/stockage/prise-confirm/prise-confirm";
import { ArticlesProvider } from '../providers/articles/articles';
import {PriseEmplacementPage} from "../pages/stockage/prise-emplacement/prise-emplacement";
import { StorageService } from "./services/storage.service";

// const appRoutes: Routes = [
//   { path: 'prise-emplacement', component: PriseEmplacementPage },
//   { path: 'home', component: MenuPage }
// ];

@NgModule({
  declarations: [
    MyApp,
    ConnectPage,
    MenuPage,
    SousMenuPage,
    PriseEmplacementPage,
    PriseArticlesPage,
    PriseConfirmPage,
    DeposePage,
    // Router
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      backButtonText: '',
      backButtonIcon: 'ios-arrow-dropleft'
    }),
    HttpClientModule,
    IonicStorageModule.forRoot({ name: '__gtfollowdb', driverOrder: ['sqlite', 'websql', 'indexeddb']})
    // RouterModule.forRoot(appRoutes, {enableTracing: true})
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ConnectPage,
    MenuPage,
    SousMenuPage,
    PriseEmplacementPage,
    PriseArticlesPage,
    PriseConfirmPage,
    DeposePage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UsersApiProvider,
    MyApp,
    SQLite,
    ArticlesProvider,
    StorageService
  ]
})
export class AppModule {}
