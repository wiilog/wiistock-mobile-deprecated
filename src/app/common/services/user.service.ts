import {Injectable} from '@angular/core';
import {zip} from 'rxjs';
import {StorageService} from '@app/common/services/storage.service';
import {NavService} from "@app/common/services/nav.service";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import LOGIN_PATH from "@pages/login/login-path";
import {MainHeaderService} from "@app/common/services/main-header.service";


@Injectable({
    providedIn: 'root'
})
export class UserService {

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService) {
    }

    public doLogout(): void {
        zip(this.sqliteService.resetDataBase(), this.storageService.clearStorage())
            .subscribe(() => {
                this.navService.setRoot(LOGIN_PATH, {autoConnect: false});
                this.mainHeaderService.emitNavigationChange();
            });
    }

}
