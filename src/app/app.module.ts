import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {AppComponent} from '@app/app.component';
import {SQLite} from '@ionic-native/sqlite';
import {ConnectPage} from '@pages/connect/connect';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {ParamsPage} from '@pages/params/params'
import {IonicStorageModule} from '@ionic/storage';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {HttpClientModule} from '@angular/common/http';
import {StorageService} from './services/storage.service';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {IonicSelectableModule} from 'ionic-selectable'
import {NetworkProvider} from '@providers/network/network';
import {Network} from '@ionic-native/network';
import {PreparationMenuPage} from '@pages/stock/preparation/preparation-menu/preparation-menu';
import {PreparationArticlesPage} from '@pages/stock/preparation/preparation-articles/preparation-articles';
import {PreparationArticleTakePage} from '@pages/stock/preparation/preparation-article-take/preparation-article-take';
import {PreparationEmplacementPage} from '@pages/stock/preparation/preparation-emplacement/preparation-emplacement';
import {LivraisonArticleTakePage} from '@pages/stock/livraison/livraison-article-take/livraison-article-take';
import {LivraisonMenuPage} from '@pages/stock/livraison/livraison-menu/livraison-menu';
import {LivraisonArticlesPage} from '@pages/stock/livraison/livraison-articles/livraison-articles';
import {LivraisonEmplacementPage} from '@pages/stock/livraison/livraison-emplacement/livraison-emplacement';
import {InventaireMenuPage} from '@pages/stock/inventaire-menu/inventaire-menu';
import {ModalQuantityPage} from '@pages/stock/inventaire-menu/modal-quantity';
import {InventaireAnomaliePage} from '@pages/stock/inventaire-anomalie/inventaire-anomalie';
import {ToastService} from '@app/services/toast.service';
import {PreparationRefArticlesPage} from '@pages/stock/preparation/preparation-ref-articles/preparation-ref-articles';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {CollecteMenuPage} from '@pages/stock/collecte/collecte-menu/collecte-menu';
import {CollecteArticleTakePage} from '@pages/stock/collecte/collecte-article-take/collecte-article-take';
import {CollecteArticlesPage} from '@pages/stock/collecte/collecte-articles/collecte-articles';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';
import {HelpersModule} from '@helpers/helpers.module';
import {AlertManagerService} from '@app/services/alert-manager.service';
import {ScssHelperService} from '@app/services/scss-helper.service';
import {VersionCheckerService} from '@app/services/version-checker.service';
import {AppVersion} from '@ionic-native/app-version';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {NewEmplacementComponent} from '@pages/new-emplacement/new-emplacement';
import {TracaListFactoryService} from '@app/services/traca-list-factory.service';
import {StockMenuPage} from '@pages/stock/stock-menu/stock-menu';
import {PrisePage} from '@pages/prise-depose/prise/prise';
import {DeposePage} from '@pages/prise-depose/depose/depose';
import {DeposeConfirmPage} from '@pages/prise-depose/depose-confirm/depose-confirm';
import {EmplacementScanPage} from '@pages/prise-depose/emplacement-scan/emplacement-scan';
import {PriseDeposeMenuPage} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu';
import {FileService} from '@app/services/file.service';
import {MainHeaderService} from "@app/services/main-header.service";


@NgModule({
    declarations: [
        AppComponent,
        ConnectPage,
        MainMenuPage,
        ParamsPage,
        PreparationArticlesPage,
        PriseDeposeMenuPage,
        PrisePage,
        PreparationArticleTakePage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PreparationEmplacementPage,
        DeposePage,
        ManutentionValidatePage,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
        CollecteMenuPage,
        CollecteArticleTakePage,
        CollecteArticlesPage,
        PreparationRefArticlesPage,
        NewEmplacementComponent,
        DeposeConfirmPage,
        PreparationRefArticlesPage,
        EmplacementScanPage,
        StockMenuPage,
        PreparationMenuPage,
        ManutentionMenuPage,
    ],
    imports: [
        IonicSelectableModule,
        BrowserModule,
        IonicModule.forRoot(AppComponent, {
            backButtonText: '',
            backButtonIcon: 'ios-arrow-dropleft'
        }),
        HttpClientModule,
        HelpersModule,
        IonicStorageModule.forRoot({name: 'follow_gt', driverOrder: ['sqlite', 'websql', 'indexeddb']})
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        AppComponent,
        ConnectPage,
        MainMenuPage,
        ParamsPage,
        PriseDeposeMenuPage,
        PreparationArticleTakePage,
        PreparationEmplacementPage,
        PreparationArticlesPage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PrisePage,
        ManutentionValidatePage,
        DeposePage,
        InventaireMenuPage,
        ModalQuantityPage,
        InventaireAnomaliePage,
        CollecteMenuPage,
        CollecteArticleTakePage,
        CollecteArticlesPage,
        PreparationRefArticlesPage,
        NewEmplacementComponent,
        DeposeConfirmPage,
        PreparationRefArticlesPage,
        EmplacementScanPage,
        StockMenuPage,
        PreparationMenuPage,
        ManutentionMenuPage,
    ],
    providers: [
        BarcodeScannerManagerService,
        StatusBar,
        SplashScreen,
        {provide: ErrorHandler, useClass: IonicErrorHandler},
        AppComponent,
        SQLite,
        VersionCheckerService,
        SqliteProvider,
        StorageService,
        BarcodeScanner,
        NetworkProvider,
        Network,
        AppVersion,
        ToastService,
        AlertManagerService,
        ApiService,
        LoadingService,
        LocalDataManagerService,
        ScssHelperService,
        TracaListFactoryService,
        FileService,
        MainHeaderService
    ]
})
export class AppModule {
}
