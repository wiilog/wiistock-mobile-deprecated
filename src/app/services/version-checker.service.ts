import {Injectable} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {flatMap, map} from 'rxjs/operators';
import {AppVersion} from '@ionic-native/app-version';
import {Observable} from 'rxjs';
import semver from 'semver';
import {from} from 'rxjs/observable/from';


@Injectable()
export class VersionCheckerService {

    public constructor(private appVersion: AppVersion,
                       private apiService: ApiService) {}


    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }> {
        return this.apiService.requestApi('get', ApiService.GET_NOMADE_VERSIONS, {secured: false, timeout: true})
            .pipe(
                flatMap((condition: string) => from(
                    this.appVersion.getVersionNumber()).pipe(map((versionNumber: string) => ([versionNumber, condition])))
                ),
                map(([versionNumber, condition]) => ({
                    available: semver.satisfies(versionNumber, condition) as boolean,
                    currentVersion: versionNumber
                }))
            );
    }
}
