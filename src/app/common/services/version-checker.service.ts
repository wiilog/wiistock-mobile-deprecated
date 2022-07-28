import {Injectable} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import semver from 'semver';
import {from, observable, Observable} from 'rxjs';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {flatMap, map} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class VersionCheckerService {

    public constructor(private appVersion: AppVersion,
                       private apiService: ApiService) {}

    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }>{
        return new Observable<{ available: boolean, currentVersion: string }>(
            (observer) => {
                this.appVersion.getVersionNumber().then(currentVersion => {
                    this.apiService.requestApi(ApiService.CHECK_NOMADE_VERSIONS, {
                        secured: false,
                        timeout: true,
                        params: {nomadeVersion: currentVersion}
                    }).subscribe(({validVersion}) => {
                        observer.next({available: validVersion, currentVersion});
                        observer.complete();
                    });
                });
            }
        );
    }
}
