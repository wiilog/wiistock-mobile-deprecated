import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {Observable} from 'rxjs';
import {from} from 'rxjs/observable/from';
import {flatMap, map} from 'rxjs/operators';
import {of} from "rxjs/observable/of";


@Injectable()
export class StorageService {

    public static readonly RIGHT_INVENTORY_MANAGER = 'inventoryManager';
    public static readonly RIGHT_DEMANDE = 'demande';
    public static readonly RIGHT_STOCK = 'stock';
    public static readonly RIGHT_TRACKING = 'tracking';

    private static readonly API_KEY = 'api-key';
    private static readonly OPERATEUR = 'operateur';
    private static readonly NB_PREPS = 'prep';

    public constructor(private storage: Storage) {}

    public initStorage(apiKey: string, operator: string, rights: {[name: string]: boolean}): Observable<any> {
        return from(this.storage.clear())
            .pipe(
                flatMap(() => Observable.zip(
                    from(this.storage.set(StorageService.API_KEY, apiKey)),
                    from(this.storage.set(StorageService.OPERATEUR, operator)),
                    from(this.storage.set(StorageService.NB_PREPS, 0)),
                    this.updateRights(rights)
                ))
            );
    }

    public updateRights(rights: {[name: string]: boolean}): Observable<any> {
        const rightKeys = Object.keys(rights);
        return rightKeys.length > 0
            ? Observable.zip(...(rightKeys.map((key) => from(this.storage.set(key, Number(Boolean(rights[key])))))))
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

    private getRight(rightName: string): Observable<boolean> {
        return from(this.storage.get(rightName))
            .pipe(map((value) => Boolean(value)));
    }
}
