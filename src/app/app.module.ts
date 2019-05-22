import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { SQLite } from "@ionic-native/sqlite";

import { ConnectPage } from '../pages/connect/connect';
import { MenuPage } from '../pages/menu/menu';
import { DeposePage } from "../pages/stockage/depose/depose";
import { IonicStorageModule } from "@ionic/storage";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpClientModule } from "@angular/common/http";
import { UsersApiProvider } from '../providers/users-api/users-api';
import { PriseArticlesPage } from "../pages/stockage/prise-articles/prise-articles";
import { PriseConfirmPage } from "../pages/stockage/prise-confirm/prise-confirm";
import { PriseEmplacementPage } from "../pages/stockage/prise-emplacement/prise-emplacement";
import { StorageService } from "./services/storage.service";
import { StockageMenuPage } from "../pages/stockage/stockage-menu/stockage-menu";
import { SqliteProvider } from "../providers/sqlite/sqlite";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@NgModule({
  declarations: [
    MyApp,
    ConnectPage,
    MenuPage,
    StockageMenuPage,
    PriseEmplacementPage,
    PriseArticlesPage,
    PriseConfirmPage,
    DeposePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      backButtonText: '',
      backButtonIcon: 'ios-arrow-dropleft'
    }),
    HttpClientModule,
    IonicStorageModule.forRoot({ name: 'follow_gt', driverOrder: ['sqlite', 'websql', 'indexeddb']})
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ConnectPage,
    MenuPage,
    StockageMenuPage,
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
    SqliteProvider,
    StorageService,
    BarcodeScanner
  ]
})
export class AppModule {}
