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
                       notificationChannels: [string]): Observable<any> {
        return from(this.getServerUrl())
            .pipe(
                flatMap((serverUrl) => from(this.storage.clear()).pipe(map(() => serverUrl))),
                flatMap((serverUrl) => zip(
                    from(this.storage.set(StorageKeyEnum.URL_SERVER, serverUrl)),
                    from(this.storage.set(StorageKeyEnum.API_KEY, apiKey)),
                    from(this.storage.set(StorageKeyEnum.OPERATOR, operator)),
                    from(this.storage.set(StorageKeyEnum.OPERATOR_ID, operatorId)),
                    from(this.storage.set(StorageKeyEnum.NOTIFICATION_CHANNELS, JSON.stringify(notificationChannels))),
                    from(this.storage.set(StorageKeyEnum.NB_PREPS, 0)),
                    from(this.storage.set(StorageKeyEnum.NB_PREPS, 0)),
                    this.updateRights(rights)
                ))
            );
    }

    public clearStorage(): Observable<void> {
        return from(this.getServerUrl())
            .pipe(
                flatMap((serverUrl) => from(this.storage.clear()).pipe(map(() => serverUrl))),
                flatMap((serverUrl) => from(this.storage.set(StorageKeyEnum.URL_SERVER, serverUrl))),
                map(() => undefined)
            );
    }

    public updateRights(rights: {[name: string]: boolean}): Observable<any> {
        const rightKeys = Object.keys(rights);
        return rightKeys.length > 0
            ? zip(...(rightKeys.map((key) => from(this.storage.set(key, Number(Boolean(rights[key])))))))
            : of(undefined);
    }



    public getItem(key: StorageKeyEnum): Observable<string> {
        return from(this.storage.get(key));
    }

    public setItem(key: StorageKeyEnum, value: string): Observable<string> {
        return from(this.storage.set(key, value));
    }

    public getOperator(): Observable<string> {
        return from(this.storage.get(StorageKeyEnum.OPERATOR));
    }

    public getOperatorId(): Observable<number> {
        return from(this.storage.get(StorageKeyEnum.OPERATOR_ID)).pipe(map(Number));
    }

    public getFinishedPreps(): Observable<number> {
        return from(this.storage.get(StorageKeyEnum.NB_PREPS));
    }

    public getApiKey(): Observable<string> {
        return from(this.storage.get(StorageKeyEnum.API_KEY));
    }

    public getInventoryManagerRight(): Observable<boolean> {
        return this.getRight(StorageKeyEnum.RIGHT_INVENTORY_MANAGER);
    }

    public getDemandeAccessRight(): Observable<boolean> {
        return this.getRight(StorageKeyEnum.RIGHT_DEMANDE);
    }

    public isDemoMode(): Observable<boolean> {
        return this.getRight(StorageKeyEnum.DEMO_MODE);
    }

    public getTrackingAccessRight(): Observable<boolean> {
        return this.getRight(StorageKeyEnum.RIGHT_TRACKING);
    }

    public getStockAccessRight(): Observable<boolean> {
        return this.getRight(StorageKeyEnum.RIGHT_STOCK);
    }

    public addPrepa(): Observable<any> {
        return from(this.storage.get(StorageKeyEnum.NB_PREPS)).pipe(
            flatMap((nbPrepas) => from(this.storage.set(StorageKeyEnum.NB_PREPS, nbPrepas + 1))),
            map(() => undefined)
        );
    }

    public setServerUrl(url: string): Observable<any> {
        return from(this.storage.set(StorageKeyEnum.URL_SERVER, url));
    }

    public getServerUrl(): Observable<string> {
        return from(this.storage.get(StorageKeyEnum.URL_SERVER));
    }

    private getRight(rightName: string): Observable<boolean> {
        return from(this.storage.get(rightName))
            .pipe(map((value) => Boolean(value)));
    }
}
