import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';
import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {AppRoutingModule} from './app-routing.module';
import {IonicStorageModule} from '@ionic/storage';
import {AppComponent} from './components/app/app.component';
import {CommonModule} from '@app/common/common.module';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';


@NgModule({
    declarations: [
        AppComponent
    ],
    entryComponents: [],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        IonicStorageModule.forRoot(),
        CommonModule
    ],
    providers: [
        StatusBar,
        SplashScreen,
        FCM,
        LocalNotifications,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
    ],
    exports: [],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
}
