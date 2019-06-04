import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {MyApp} from './app.component';
import {SQLite} from "@ionic-native/sqlite";

import {ConnectPage} from '../pages/connect/connect';
import {MenuPage} from '../pages/menu/menu';
import {DeposePage} from "../pages/stockage/depose/depose";
import {DeposePageTraca} from '../pages/traca/depose/depose-traca'
import {IonicStorageModule} from "@ionic/storage";

import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {HttpClientModule} from "@angular/common/http";
import {UsersApiProvider} from '../providers/users-api/users-api';


import {PriseArticlesPage} from "../pages/stockage/prise-articles/prise-articles";
import {PriseConfirmPage} from "../pages/stockage/prise-confirm/prise-confirm";
import {PriseEmplacementPage} from "../pages/stockage/prise-emplacement/prise-emplacement";

import {PriseArticlesPageTraca} from "../pages/traca/prise-articles/prise-articles-traca";
import {PriseConfirmPageTraca} from "../pages/traca/prise-confirm/prise-confirm-traca";
import {PriseEmplacementPageTraca} from "../pages/traca/prise-emplacement/prise-emplacement-traca";

import {DeposeArticlesPageTraca} from "../pages/traca/depose-articles/depose-articles-traca";
import {DeposeConfirmPageTraca} from "../pages/traca/depose-confirm/depose-confirm-traca";
import {DeposeEmplacementPageTraca} from "../pages/traca/depose-emplacement/depose-emplacement-traca";

import {StorageService} from "./services/storage.service";
import {StockageMenuPage} from "../pages/stockage/stockage-menu/stockage-menu";
import {StockageMenuPageTraca} from "../pages/traca/stockage-menu/stockage-menu-traca";
import {SqliteProvider} from "../providers/sqlite/sqlite";
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {IonicSelectableModule} from 'ionic-selectable'

@NgModule({
    declarations: [
        MyApp,
        ConnectPage,
        MenuPage,
        StockageMenuPage,
        StockageMenuPageTraca,
        PriseEmplacementPage,
        PriseArticlesPage,
        PriseConfirmPage,
        PriseEmplacementPageTraca,
        PriseArticlesPageTraca,
        PriseConfirmPageTraca,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        DeposeConfirmPageTraca,
        DeposePage,
        DeposePageTraca,
    ],
    imports: [
        IonicSelectableModule,
        BrowserModule,
        IonicModule.forRoot(MyApp, {
            backButtonText: '',
            backButtonIcon: 'ios-arrow-dropleft'
        }),
        HttpClientModule,
        IonicStorageModule.forRoot({name: 'follow_gt', driverOrder: ['sqlite', 'websql', 'indexeddb']})
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        ConnectPage,
        MenuPage,
        StockageMenuPage,
        StockageMenuPageTraca,
        PriseEmplacementPage,
        PriseArticlesPage,
        PriseConfirmPage,
        PriseEmplacementPageTraca,
        PriseArticlesPageTraca,
        PriseConfirmPageTraca,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        DeposeConfirmPageTraca,
        DeposePage,
        DeposePageTraca,
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
export class AppModule {
}
