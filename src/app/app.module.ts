import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {MyApp} from './app.component';
import {SQLite} from "@ionic-native/sqlite";

import {ConnectPage} from '../pages/connect/connect';
import {MenuPage} from '../pages/menu/menu';
import {ParamsPage} from '../pages/params/params'
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
import {NetworkProvider} from "../providers/network/network";
import {Network} from "@ionic-native/network";
import {PreparationMenuPage} from "../pages/preparation/preparation-menu/preparation-menu";
import {PreparationArticlesPage} from "../pages/preparation/preparation-articles/preparation-articles";
import {PreparationArticleTakePage} from "../pages/preparation/preparation-article-take/preparation-article-take";
import {PreparationEmplacementPage} from "../pages/preparation/preparation-emplacement/preparation-emplacement";
import {LivraisonArticleTakePage} from "../pages/livraison/livraison-article-take/livraison-article-take";
import {LivraisonMenuPage} from "../pages/livraison/livraison-menu/livraison-menu";
import {LivraisonArticlesPage} from "../pages/livraison/livraison-articles/livraison-articles";
import {LivraisonEmplacementPage} from "../pages/livraison/livraison-emplacement/livraison-emplacement";
import {InventaireMenuPage} from "../pages/inventaire/inventaire-menu/inventaire-menu";
import {ModalQuantityPage} from "../pages/inventaire/inventaire-menu/modal-quantity";
import {InventaireAnomaliePage} from "../pages/inventaire-anomalie/inventaire-anomalie";

@NgModule({
    declarations: [
        MyApp,
        ConnectPage,
        MenuPage,
        ParamsPage,
        StockageMenuPage,
        PreparationMenuPage,
        PreparationArticlesPage,
        StockageMenuPageTraca,
        PriseEmplacementPage,
        PriseArticlesPage,
        PriseConfirmPage,
        PriseEmplacementPageTraca,
        PriseArticlesPageTraca,
        PreparationArticleTakePage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PreparationEmplacementPage,
        PriseConfirmPageTraca,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        DeposeConfirmPageTraca,
        DeposePage,
        DeposePageTraca,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
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
    exports: [
        InventaireMenuPage,
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        ConnectPage,
        MenuPage,
        ParamsPage,
        StockageMenuPage,
        StockageMenuPageTraca,
        PriseEmplacementPage,
        PriseArticlesPage,
        PriseConfirmPage,
        PriseEmplacementPageTraca,
        PreparationMenuPage,
        PreparationArticleTakePage,
        PreparationEmplacementPage,
        PreparationArticlesPage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PriseArticlesPageTraca,
        PriseConfirmPageTraca,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        DeposeConfirmPageTraca,
        DeposePage,
        DeposePageTraca,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
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
        BarcodeScanner,
        NetworkProvider,
        Network,
    ]
})
export class AppModule {
}
