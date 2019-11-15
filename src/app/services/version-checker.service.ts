import {Injectable} from '@angular/core';
import {ApiService} from '@app/services/api.service';
import {filter, flatMap, map} from 'rxjs/operators';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {AppVersion} from '@ionic-native/app-version';
import {Observable} from 'rxjs';
import semver from 'semver';
import {HttpClient} from '@angular/common/http';
import {from} from 'rxjs/observable/from';


@Injectable()
export class VersionCheckerService {

    public constructor(private appVersion: AppVersion,
                       private httpClient: HttpClient,
                       private sqliteProvider: SqliteProvider) {
    }


    public isAvailableVersion(): Observable<{ available: boolean, currentVersion: string }> {
        return this.sqliteProvider.getApiUrl(ApiService.GET_NOMADE_VERSIONS)
            .pipe(
                filter((url: string) => Boolean(url)),
                flatMap((nomadeVersionUrl: string) => this.httpClient.get(nomadeVersionUrl)),
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
