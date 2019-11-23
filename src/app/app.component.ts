import {Component, ViewChild, Injectable} from '@angular/core';
import {Platform, MenuController, Nav} from 'ionic-angular';
import {ConnectPage} from '@pages/connect/connect';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {NetworkProvider} from '@providers/network/network';
import {Network} from '@ionic-native/network';
import {ScssHelperService} from '@app/services/scss-helper.service';
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";
import {Subscription} from "rxjs";
import {ManutentionValidatePage} from "@pages/manutention/manutention-validate/manutention-validate";


@Injectable()
@Component({
    selector: 'wii-app',
    templateUrl: 'app.component.html'
})
export class AppComponent {

    private static readonly DEFAULT_STATUS_BAR_COLOR = 'black';

    @ViewChild(Nav)
    public nav: Nav;

    // make ConnectPage the root (or first) page
    public rootPage = ConnectPage;

    public pageWithHeader: boolean;

    public platformReady: boolean;
    public currentPageName: string;
    public readonly pageHasNotPadding: Array<string> = [
        ManutentionMenuPage.name,
        ManutentionValidatePage.name
    ];

    private viewDidEnterSubscription: Subscription;

    private readonly primaryColor: string;


    public constructor(public platform: Platform,
                       public menu: MenuController,
                       public statusBar: StatusBar,
                       public splashScreen: SplashScreen,
                       public networkProvider: NetworkProvider,
                       public network: Network,
                       private scssHelper: ScssHelperService) {
        this.platformReady = false;
        this.primaryColor = this.scssHelper.getVariable('primary');
        this.initializeApp();
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

            if(this.viewDidEnterSubscription) {
                this.viewDidEnterSubscription.unsubscribe();
            }
            this.viewDidEnterSubscription = this.nav.viewDidEnter.subscribe((data) => {
                this.currentPageName = data.component.name;
            });
        });
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        this.setStatusBarColor();
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
