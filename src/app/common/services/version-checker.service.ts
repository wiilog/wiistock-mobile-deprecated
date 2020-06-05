import {Injectable} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import semver from 'semver';
import {from, Observable} from 'rxjs';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {flatMap, map} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class VersionCheckerService {

    public constructor(private appVersion: AppVersion,
                       private apiService: ApiService) {}

    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }> {
        return this.apiService.requestApi('get', ApiService.GET_NOMADE_VERSIONS, {secured: false, timeout: true})
            .pipe(
                flatMap((condition: string) => (
                    from(this.appVersion.getVersionNumber())
                        .pipe(map((versionNumber: string) => ([versionNumber, condition])))
                )),
                map(([versionNumber, condition]) => ({
                    available: semver.satisfies(versionNumber, condition) as boolean,
                    currentVersion: versionNumber
                }))
            );
    }
}
