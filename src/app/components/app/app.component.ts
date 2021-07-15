import {Component} from '@angular/core';
import {Platform} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {ScssHelperService} from '@app/common/services/scss-helper.service';
import {from} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {flatMap} from 'rxjs/operators';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {ServerImageService} from '@app/common/services/server-image.service';
import {NotificationService} from '@app/common/services/notification.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';

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
                       private serverImageService: ServerImageService,
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
                flatMap(() => this.serverImageService.loadFromStorage()),
                flatMap(() => this.storageService.clearStorage([StorageKeyEnum.URL_SERVER, StorageKeyEnum.OPERATOR])),
                flatMap(() => this.serverImageService.saveToStorage()),
                flatMap(() => this.navService.setRoot(NavPathEnum.LOGIN)),
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
