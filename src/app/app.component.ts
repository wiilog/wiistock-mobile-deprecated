import {Component, ViewChild, Injectable, ElementRef} from '@angular/core';
import {Platform, MenuController} from 'ionic-angular';
import {ConnectPage} from '@pages/connect/connect';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {NetworkProvider} from '@providers/network/network';
import {Network} from '@ionic-native/network';
import {ScssHelperService} from '@app/services/scss-helper.service';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/fromEvent';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';


@Injectable()
@Component({
    selector: 'wii-app',
    templateUrl: 'app.component.html'
})
export class AppComponent {

    private static readonly DEFAULT_STATUS_BAR_COLOR = 'black';

    @ViewChild('ionNavComponent', {read: ElementRef})
    public ionNavElementRef: ElementRef;

    @ViewChild('mainHeaderComponent', {read: ElementRef})
    public mainHeaderComponent: ElementRef;

    // make ConnectPage the root (or first) page
    public rootPage = ConnectPage;

    public pageWithHeader: boolean;

    public platformReady: boolean;

    public ionNavStyle: { [key: string]: string; };

    public keyboardShown$: Observable<boolean>;

    private readonly primaryColor: string;

    public constructor(public platform: Platform,
                       public menu: MenuController,
                       public statusBar: StatusBar,
                       public splashScreen: SplashScreen,
                       public networkProvider: NetworkProvider,
                       public network: Network,
                       private scssHelper: ScssHelperService) {
        this.platformReady = false;
        this.ionNavStyle = {};
        this.primaryColor = this.scssHelper.getVariable('primary');
        this.initializeApp();

        this.keyboardShown$ = Observable.merge(
            Observable.fromEvent(window, 'keyboardDidShow').pipe(map(() => true)),
            Observable.fromEvent(window, 'keyboardDidHide').pipe(map(() => false))
        );
    }

    public initializeApp() {
        this.platform.ready().then(() => {
            this.platformReady = true;

            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            this.statusBar.styleBlackTranslucent();
            this.setStatusBarColor();
            this.splashScreen.hide();
            this.networkProvider.initializeNetworkEvents();
        });
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        this.setStatusBarColor();
    }

    public onHeaderHeightChange(headerHeight: number): void {
        this.ionNavStyle = {
            height: `calc(100% - ${headerHeight}px)`,
            top: `${headerHeight}px`
        };
    }

    private setStatusBarColor(): void {
        if (this.platformReady) {
            if (this.pageWithHeader) {
                this.statusBar.backgroundColorByHexString(this.primaryColor);
            }
            else {
                this.statusBar.backgroundColorByName(AppComponent.DEFAULT_STATUS_BAR_COLOR);
            }
        }
    }
}
