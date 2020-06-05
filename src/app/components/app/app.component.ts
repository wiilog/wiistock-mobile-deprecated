import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {ScssHelperService} from '@app/common/services/scss-helper.service';
import {from} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {flatMap} from 'rxjs/operators';
import {LoginPageRoutingModule} from '@pages/login/login-routing.module';
import {SqliteService} from '@app/common/services/sqlite.service';
import {StorageService} from '@app/common/services/storage.service';

@Component({
    selector: 'wii-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {

    public pageWithHeader: boolean;
    public platformReady: boolean;

    private readonly primaryColor: string;
    private readonly darkColor: string;

    public constructor(private platform: Platform,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private scssHelper: ScssHelperService,
                       private splashScreen: SplashScreen,
                       private statusBar: StatusBar) {
        this.platformReady = false;
        this.primaryColor = this.scssHelper.getVariable('ion-color-primary');
        this.darkColor = this.scssHelper.getVariable('ion-color-dark');
        this.initializeApp();
    }

    public onHeaderChange(withHeader: boolean): void {
        this.pageWithHeader = withHeader;
        this.setStatusBarColor();
    }

    public initializeApp(): void {
        this.splashScreen.show();
        from(this.platform.ready())
            .pipe(
                flatMap(() => this.sqliteService.resetDataBase()),
                flatMap(() => this.storageService.clearStorage()),
                flatMap(() => this.navService.setRoot(LoginPageRoutingModule.PATH))
            )
            .subscribe(() => {
                this.platformReady = true;
                this.statusBar.styleBlackTranslucent();
                this.setStatusBarColor();
            });
    }

    private setStatusBarColor(): void {
        if (this.platformReady) {
            const colorStatusBar = this.pageWithHeader ? this.primaryColor : this.darkColor;
            this.statusBar.backgroundColorByHexString(colorStatusBar);
        }
    }
}
