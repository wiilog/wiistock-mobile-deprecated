import {BrowserModule} from '@angular/platform-browser';
import {NgModule, ErrorHandler} from '@angular/core';
import {IonicApp, IonicModule, IonicErrorHandler} from 'ionic-angular';
import {AppComponent} from '@app/app.component';
import {SQLite} from '@ionic-native/sqlite';
import {ConnectPage} from '@pages/connect/connect';
import {MenuPage} from '@pages/menu/menu';
import {ParamsPage} from '@pages/params/params'
import {IonicStorageModule} from '@ionic/storage';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {HttpClientModule} from '@angular/common/http';
import {UsersApiProvider} from '@providers/users-api/users-api';
import {PriseArticlesPageTraca} from '@pages/traca/prise-articles/prise-articles-traca';
import {PriseEmplacementPageTraca} from '@pages/traca/prise-emplacement/prise-emplacement-traca';
import {DeposeArticlesPageTraca} from '@pages/traca/depose-articles/depose-articles-traca';
import {DeposeEmplacementPageTraca} from '@pages/traca/depose-emplacement/depose-emplacement-traca';
import {StorageService} from './services/storage.service';
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
import {HelpersModule} from '@helpers/helpers.module';
import {EntityFactoryService} from '@app/services/entity-factory.service';
import {AlertManagerService} from '@app/services/alert-manager.service';
import {VersionCheckerService} from "@app/services/version-checker.service";
import {AppVersion} from "@ionic-native/app-version";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {ScssHelperService} from "@app/services/scss-helper.service";


@NgModule({
    declarations: [
        AppComponent,
        ConnectPage,
        MenuPage,
        ParamsPage,
        PreparationMenuPage,
        PreparationArticlesPage,
        TracaMenuPage,
        PriseEmplacementPageTraca,
        PriseArticlesPageTraca,
        PreparationArticleTakePage,
        ManutentionMenuPage,
        LivraisonArticleTakePage,
        LivraisonMenuPage,
        LivraisonArticlesPage,
        LivraisonEmplacementPage,
        PreparationEmplacementPage,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
        ManutentionValidatePage,
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
        HelpersModule,
        IonicStorageModule.forRoot({name: 'follow_gt', driverOrder: ['sqlite', 'websql', 'indexeddb']})
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        AppComponent,
        ConnectPage,
        MenuPage,
        ParamsPage,
        TracaMenuPage,
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
        ManutentionMenuPage,
        ManutentionValidatePage,
        DeposeEmplacementPageTraca,
        DeposeArticlesPageTraca,
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
        VersionCheckerService,
        SqliteProvider,
        StorageService,
        BarcodeScanner,
        NetworkProvider,
        Network,
        AppVersion,
        ToastService,
        AlertManagerService,
        EntityFactoryService,
        LocalDataManagerService,
        ScssHelperService
    ]
})
export class AppModule {
}
