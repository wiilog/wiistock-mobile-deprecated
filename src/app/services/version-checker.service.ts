import {Injectable} from '@angular/core';
import {ApiServices} from '@app/config/api-services';
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


    public isAvailableVersion(): Observable<boolean> {
        return this.sqliteProvider.getApiUrl(ApiServices.GET_NOMADE_VERSIONS)
            .pipe(
                filter((url) => url),
                flatMap((nomadeVersionUrl) => this.httpClient.get(nomadeVersionUrl)),
                flatMap((condition) => from(this.appVersion.getVersionNumber()).pipe(map((versionNumber) => ([versionNumber, condition])))),
                map((params) => semver.satisfies(...params))
            );
    }
}
