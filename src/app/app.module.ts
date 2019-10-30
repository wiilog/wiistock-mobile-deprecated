import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {AppComponent} from '@app/app.component';
import {SQLite} from '@ionic-native/sqlite';
import {ConnectPage} from '@pages/connect/connect';
import {MenuPage} from '@pages/menu/menu';
import {ParamsPage} from '@pages/params/params'
import {DeposePage} from '@pages/stockage/depose/depose';
import {DeposePageTraca} from '@pages/traca/depose/depose-traca'
import {IonicStorageModule} from '@ionic/storage';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {HttpClientModule} from '@angular/common/http';
import {UsersApiProvider} from '@providers/users-api/users-api';
import {PriseArticlesPage} from '@pages/stockage/prise-articles/prise-articles';
import {PriseConfirmPage} from '@pages/stockage/prise-confirm/prise-confirm';
import {PriseEmplacementPage} from '@pages/stockage/prise-emplacement/prise-emplacement';
import {PriseArticlesPageTraca} from '@pages/traca/prise-articles/prise-articles-traca';
import {SelectArticleManuallyPage} from '@pages/traca/select-article-manually/select-article-manually';
import {PriseEmplacementPageTraca} from '@pages/traca/prise-emplacement/prise-emplacement-traca';
import {DeposeArticlesPageTraca} from '@pages/traca/depose-articles/depose-articles-traca';
import {DeposeEmplacementPageTraca} from '@pages/traca/depose-emplacement/depose-emplacement-traca';
import {StorageService} from './services/storage.service';
import {StockageMenuPage} from '@pages/stockage/stockage-menu/stockage-menu';
import {TracaMenuPage} from '@pages/traca/traca-menu/traca-menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {IonicSelectableModule} from 'ionic-selectable'
import {NetworkProvider} from '@providers/network/network';
import {Network} from '@ionic-native/network';
import {PreparationMenuPage} from '@pages/preparation/preparation-menu/preparation-menu';
import {PreparationArticlesPage} from '@pages/preparation/preparation-articles/preparation-articles';
import {PreparationArticleTakePage} from '@pages/preparation/preparation-article-take/preparation-article-take';
import {PreparationEmplacementPage} from '@pages/preparation/preparation-emplacement/preparation-emplacement';
import {LivraisonArticleTakePage} from '@pages/livraison/livraison-article-take/livraison-article-take';
import {LivraisonMenuPage} from '@pages/livraison/livraison-menu/livraison-menu';
import {LivraisonArticlesPage} from '@pages/livraison/livraison-articles/livraison-articles';
import {LivraisonEmplacementPage} from '@pages/livraison/livraison-emplacement/livraison-emplacement';
import {InventaireMenuPage} from '@pages/inventaire-menu/inventaire-menu';
import {ModalQuantityPage} from '@pages/inventaire-menu/modal-quantity';
import {InventaireAnomaliePage} from '@pages/inventaire-anomalie/inventaire-anomalie';
import {ToastService} from '@app/services/toast.service';
import {PreparationRefArticlesPage} from '@pages/preparation/preparation-ref-articles/preparation-ref-articles';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {CollecteMenuPage} from '@pages/collecte/collecte-menu/collecte-menu';
import {CollecteArticleTakePage} from '@pages/collecte/collecte-article-take/collecte-article-take';
import {CollecteArticlesPage} from '@pages/collecte/collecte-articles/collecte-articles';
import {CollecteEmplacementPage} from '@pages/collecte/collecte-emplacement/collecte-emplacement';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';


@NgModule({
    declarations: [
        AppComponent,
        ConnectPage,
        MenuPage,
        ParamsPage,
        StockageMenuPage,
        PreparationMenuPage,
        PreparationArticlesPage,
        TracaMenuPage,
        PriseEmplacementPage,
        PriseArticlesPage,
        PriseConfirmPage,
        PriseEmplacementPageTraca,
        PriseArticlesPageTraca,
        PreparationArticleTakePage,
        ManutentionMenuPage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PreparationEmplacementPage,
        SelectArticleManuallyPage,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        ManutentionValidatePage,
        DeposePage,
        DeposePageTraca,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
        CollecteMenuPage,
        CollecteArticleTakePage,
        CollecteArticlesPage,
        CollecteEmplacementPage,
        PreparationRefArticlesPage
    ],
    imports: [
        IonicSelectableModule,
        BrowserModule,
        IonicModule.forRoot(AppComponent, {
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
        AppComponent,
        ConnectPage,
        MenuPage,
        ParamsPage,
        StockageMenuPage,
        TracaMenuPage,
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
        SelectArticleManuallyPage,
        ManutentionMenuPage,
        ManutentionValidatePage,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        DeposePage,
        DeposePageTraca,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
        CollecteMenuPage,
        CollecteArticleTakePage,
        CollecteArticlesPage,
        CollecteEmplacementPage,
        PreparationRefArticlesPage
    ],
    providers: [
        BarcodeScannerManagerService,
        StatusBar,
        SplashScreen,
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        UsersApiProvider,
        AppComponent,
        SQLite,
        SqliteProvider,
        StorageService,
        BarcodeScanner,
        NetworkProvider,
        Network,
        ToastService
    ]
})
export class AppModule {
}
