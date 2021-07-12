import {Injectable} from '@angular/core';
import {zip} from 'rxjs';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavService} from "@app/common/services/nav/nav.service";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {MainHeaderService} from "@app/common/services/main-header.service";
import {flatMap} from 'rxjs/operators';
import {LoadingService} from '@app/common/services/loading.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';


@Injectable({
    providedIn: 'root'
})
export class UserService {

    public static readonly MAX_PSEUDO_LENGTH: number = 35;

    private logoutOnProgress: boolean;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private navService: NavService,
                       private fcm: FCM,
                       private mainHeaderService: MainHeaderService) {
        this.logoutOnProgress = false;
    }

    public doLogout(): void {
        if (!this.logoutOnProgress) {
            this.logoutOnProgress = true;
            zip(
                this.sqliteService.resetDataBase(),
                this.storageService.clearStorage([StorageKeyEnum.URL_SERVER]),
                this.fcm.deleteInstanceId()
            )
                .pipe(
                    flatMap(() => this.navService.setRoot(NavPathEnum.LOGIN, {autoConnect: false})),
                    flatMap(() => this.loadingService.dismissLastLoading())
                )
                .subscribe(() => {
                    this.logoutOnProgress = false;
                    this.mainHeaderService.emitNavigationChange();
                });
        }
    }

}
