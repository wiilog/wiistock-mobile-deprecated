import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {from, Observable, of, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';


@Injectable({
    providedIn: 'root'
})
export class StorageService {

    public constructor(private storage: Storage) {}

    public initStorage(apiKey: string,
                       operator: string,
                       operatorId: number,
                       rights: {[name: string]: boolean},
                       notificationChannels: [string],
                       parameters: {[name: string]: boolean}): Observable<any> {
        return this.getString(StorageKeyEnum.URL_SERVER)
            .pipe(
                flatMap((serverUrl) => from(this.storage.clear()).pipe(map(() => serverUrl))),
                flatMap((serverUrl) => zip(
                    this.setItem(StorageKeyEnum.URL_SERVER, serverUrl),
                    this.setItem(StorageKeyEnum.API_KEY, apiKey),
                    this.setItem(StorageKeyEnum.OPERATOR, operator),
                    this.setItem(StorageKeyEnum.OPERATOR_ID, operatorId),
                    this.setItem(StorageKeyEnum.NOTIFICATION_CHANNELS, JSON.stringify(notificationChannels)),
                    this.resetCounters(),
                    this.updateRights(rights),
                    this.updateParameters(parameters),
                ))
            );
    }

    public clearStorage(valuesToKeep: Array<StorageKeyEnum> = []): Observable<void> {
        if (valuesToKeep.length > 0) {
            return zip(
                ...valuesToKeep.map((key) => this.getString(key))
            )
                .pipe(
                    map((data) => {
                        // wee associated all keys to value
                        return valuesToKeep.reduce((acc, currentKey, index) => {
                            acc[currentKey] = data[index];
                            return acc;
                        }, {})
                    }),
                    flatMap((initialValues) => this.clearWithInitialValues(initialValues))
                )
        }
        else {
            return this.clearWithInitialValues();
        }
    }

    public updateRights(rights: {[name: string]: boolean}): Observable<any> {
        const rightKeys = Object.keys(rights);
        return rightKeys.length > 0
            ? zip(...(rightKeys.map((key) => from(this.storage.set(key, Number(Boolean(rights[key])))))))
            : of(undefined);
    }

    public updateParameters(parameters: {[name: string]: boolean}): Observable<any> {
        const parameterKeys = Object.keys(parameters);
        return parameterKeys.length > 0
            ? zip(...(parameterKeys.map((key) => from(this.storage.set(key, Number(Boolean(parameters[key])))))))
            : of(undefined);
    }

    public getString(key: StorageKeyEnum, maxLength?: number): Observable<string> {
        return from(this.storage.get(key))
            .pipe(
                map((user: string) => (
                    maxLength
                        ? (user || '').substring(0, maxLength)
                        : user
                ))
            );
    }

    public getNumber(key: StorageKeyEnum): Observable<number> {
        return from(this.storage.get(key)).pipe(map(Number));
    }

    public getRight(rightName: string): Observable<boolean> {
        return from(this.storage.get(rightName)).pipe(map(Boolean));
    }

    public getBoolean(key: StorageKeyEnum): Observable<boolean> {
        return from(this.storage.get(key)).pipe(map(Boolean));
    }

    public setItem(key: StorageKeyEnum, value: any): Observable<void> {
        return from(this.storage.set(key, value));
    }

    public resetCounters(): Observable<void> {
        return this.setItem(StorageKeyEnum.COUNTERS, JSON.parse('{}'));
    }

    public incrementCounter(key: StorageKeyEnum): Observable<void> {
        return this.getString(StorageKeyEnum.COUNTERS).pipe(
            map((countersStr) => countersStr || {}),
            flatMap((counters) => {
                counters[key] = (counters[key] || 0) + 1;
                return this.setItem(StorageKeyEnum.COUNTERS, counters) as Observable<void>;
            })
        );
    }

    public getCounter(key: StorageKeyEnum): Observable<number> {
        return this.getString(StorageKeyEnum.COUNTERS).pipe(
            map((counters) => counters[key]),
            map((counter) => Number(counter) || 0)
        );
    }

    private clearWithInitialValues(values: {[name: string]: any} = {}): Observable<void> {
        const cacheNames = Object.keys(values);
        return from(this.storage.clear())
            .pipe(
                flatMap(() => cacheNames.length > 0
                    ? zip(
                        ...cacheNames.map((name) => this.setItem(name as StorageKeyEnum, values[name]))
                    )
                    : of(undefined)
                ),
                map(() => undefined)
            );
    }
}
