import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {from, Observable, of, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class StorageService {

    public static readonly RIGHT_INVENTORY_MANAGER = 'inventoryManager';
    public static readonly RIGHT_DEMANDE = 'demande';
    public static readonly RIGHT_STOCK = 'stock';
    public static readonly RIGHT_TRACKING = 'tracking';

    private static readonly API_KEY = 'api-key';
    private static readonly OPERATEUR = 'operateur';
    private static readonly NB_PREPS = 'prep';

    private static readonly URL_SERVER = 'url-server';

    public constructor(private storage: Storage) {}

    public initStorage(apiKey: string, operator: string, rights: {[name: string]: boolean}): Observable<any> {
        return from(this.getServerUrl())
            .pipe(
                flatMap((serverUrl) => from(this.storage.clear()).pipe(map(() => serverUrl))),
                flatMap((serverUrl) => zip(
                    from(this.storage.set(StorageService.URL_SERVER, serverUrl)),
                    from(this.storage.set(StorageService.API_KEY, apiKey)),
                    from(this.storage.set(StorageService.OPERATEUR, operator)),
                    from(this.storage.set(StorageService.NB_PREPS, 0)),
                    this.updateRights(rights)
                ))
            );
    }

    public clearStorage(): Observable<void> {
        return from(this.getServerUrl())
            .pipe(
                flatMap((serverUrl) => from(this.storage.clear()).pipe(map(() => serverUrl))),
                flatMap((serverUrl) => from(this.storage.set(StorageService.URL_SERVER, serverUrl))),
                map(() => undefined)
            );
    }

    public updateRights(rights: {[name: string]: boolean}): Observable<any> {
        const rightKeys = Object.keys(rights);
        return rightKeys.length > 0
            ? zip(...(rightKeys.map((key) => from(this.storage.set(key, Number(Boolean(rights[key])))))))
            : of(undefined);
    }

    public getOperateur(): Observable<string> {
        return from(this.storage.get(StorageService.OPERATEUR));
    }

    public getFinishedPreps(): Observable<number> {
        return from(this.storage.get(StorageService.NB_PREPS));
    }

    public getApiKey(): Observable<string> {
        return from(this.storage.get(StorageService.API_KEY));
    }

    public getInventoryManagerRight(): Observable<boolean> {
        return this.getRight(StorageService.RIGHT_INVENTORY_MANAGER);
    }

    public getDemandeAccessRight(): Observable<boolean> {
        return this.getRight(StorageService.RIGHT_DEMANDE);
    }

    public getTrackingAccessRight(): Observable<boolean> {
        return this.getRight(StorageService.RIGHT_TRACKING);
    }

    public getStockAccessRight(): Observable<boolean> {
        return this.getRight(StorageService.RIGHT_STOCK);
    }

    public addPrepa(): Observable<any> {
        return from(this.storage.get(StorageService.NB_PREPS)).pipe(
            flatMap((nbPrepas) => from(this.storage.set(StorageService.NB_PREPS, nbPrepas + 1))),
            map(() => undefined)
        );
    }

    public setServerUrl(url: string): Observable<any> {
        return from(this.storage.set(StorageService.URL_SERVER, url));
    }

    public getServerUrl(): Observable<string> {
        return from(this.storage.get(StorageService.URL_SERVER));
    }

    private getRight(rightName: string): Observable<boolean> {
        return from(this.storage.get(rightName))
            .pipe(map((value) => Boolean(value)));
    }
}
