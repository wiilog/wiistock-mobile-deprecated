import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { ConnectPage } from '../pages/connect/connect';
import { ListPage } from '../pages/list/list';
import { ItemDetailsPage } from '../pages/item-details/item-details';
import { PrisePage } from "../pages/prise/prise";
import { DeposePage } from "../pages/depose/depose";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HttpClientModule } from "@angular/common/http";
import { UsersApiProvider } from '../providers/users-api/users-api';

@NgModule({
  declarations: [
    MyApp,
    ConnectPage,
    ListPage,
    ItemDetailsPage,
    PrisePage,
    DeposePage,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      backButtonText: '',
      backButtonIcon: 'ios-arrow-dropleft'
    }),
    HttpClientModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ConnectPage,
    ListPage,
    ItemDetailsPage,
    PrisePage,
    DeposePage,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UsersApiProvider
  ]
})
export class AppModule {}
