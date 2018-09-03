import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { EntreeAddPage } from '../pages/entree-add/entree-add';
import { EntreeFlashPage } from '../pages/entree-flash/entree-flash';
import { EntreeRecapitulatifPage } from '../pages/entree-recapitulatif/entree-recapitulatif';
import { SortieAddPage } from '../pages/sortie-add/sortie-add';
import { SortieFlashPage } from '../pages/sortie-flash/sortie-flash';
import { SortieRecapitulatifPage } from '../pages/sortie-recapitulatif/sortie-recapitulatif';
import { PreparationAddPage } from '../pages/preparation-add/preparation-add';
import { PreparationFlashPage } from '../pages/preparation-flash/preparation-flash';
import { PreparationRecapitulatifPage } from '../pages/preparation-recapitulatif/preparation-recapitulatif';
import { ReceptionAddPage } from '../pages/reception-add/reception-add';
import { ReceptionFlashPage } from '../pages/reception-flash/reception-flash';
import { ReceptionRecapitulatifPage } from '../pages/reception-recapitulatif/reception-recapitulatif';
import { TransfertAddPage } from '../pages/transfert-add/transfert-add';
import { TransfertFlashPage } from '../pages/transfert-flash/transfert-flash';
import { TransfertRecapitulatifPage } from '../pages/transfert-recapitulatif/transfert-recapitulatif';
import { WorkflowPage } from '../pages/workflow/workflow';
import { InventoryListPage } from '../pages/inventory-list/inventory-list';
import { InventoryViewPage } from '../pages/inventory-view/inventory-view';
import { OrdreDetailPage } from '../pages/ordre-detail/ordre-detail';

import { HttpClientModule } from '@angular/common/http';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TestApiProvider } from '../providers/test-api/test-api';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage,
    EntreeAddPage,
    EntreeFlashPage,
    EntreeRecapitulatifPage,
    SortieAddPage,
    SortieFlashPage,
    SortieRecapitulatifPage,
    PreparationAddPage,
    PreparationFlashPage,
    PreparationRecapitulatifPage,
    ReceptionAddPage,
    ReceptionFlashPage,
    ReceptionRecapitulatifPage,
    TransfertAddPage,
    TransfertFlashPage,
    TransfertRecapitulatifPage,
    WorkflowPage,
    SortieAddPage,
    InventoryListPage,
    InventoryViewPage,
    OrdreDetailPage
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ListPage,
    EntreeAddPage,
    EntreeFlashPage,
    EntreeRecapitulatifPage,
    SortieAddPage,
    SortieFlashPage,
    SortieRecapitulatifPage,
    PreparationAddPage,
    PreparationFlashPage,
    PreparationRecapitulatifPage,
    ReceptionAddPage,
    ReceptionFlashPage,
    ReceptionRecapitulatifPage,
    TransfertAddPage,
    TransfertFlashPage,
    TransfertRecapitulatifPage,
    WorkflowPage,
    SortieAddPage,
    InventoryListPage,
    InventoryViewPage,
    OrdreDetailPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    TestApiProvider
  ]
})
export class AppModule {}
