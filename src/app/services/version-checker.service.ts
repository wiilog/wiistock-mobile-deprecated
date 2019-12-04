import {Injectable} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {filter, flatMap, map, timeout} from 'rxjs/operators';
import {AppVersion} from '@ionic-native/app-version';
import {Observable} from 'rxjs';
import semver from 'semver';
import {HttpClient} from '@angular/common/http';
import {from} from 'rxjs/observable/from';


@Injectable()
export class VersionCheckerService {

    public constructor(private appVersion: AppVersion,
                       private httpClient: HttpClient,
                       private apiService: ApiService) {}


    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }> {
        return this.apiService.getApiUrl(ApiService.GET_NOMADE_VERSIONS)
            .pipe(
                filter((url: string) => Boolean(url)),
                flatMap((nomadeVersionUrl: string) => this.httpClient.get(nomadeVersionUrl).pipe(timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT))),
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
