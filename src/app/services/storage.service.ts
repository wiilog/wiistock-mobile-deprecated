import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {Observable} from 'rxjs';
import {from} from 'rxjs/observable/from';
import {flatMap, map} from 'rxjs/operators';


@Injectable()
export class StorageService {

    private static readonly API_KEY = 'api-key';
    private static readonly INVENTORY_MANAGER = 'inventory-manager';
    private static readonly OPERATEUR = 'operateur';
    private static readonly NB_PREPS = 'prep';

    public constructor(private storage: Storage) {}

    public initStorage(apiKey: string, operator: string, isInventoryManager: boolean): Observable<any> {
        return from(this.storage.clear())
            .pipe(flatMap(() => from(Promise.all([
                this.storage.set(StorageService.API_KEY, apiKey),
                this.storage.set(StorageService.OPERATEUR, operator),
                this.storage.set(StorageService.INVENTORY_MANAGER, (isInventoryManager ? 1 : 0)),
                this.storage.set(StorageService.NB_PREPS, 0)
            ]))));
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
        return from(this.storage.get(StorageService.INVENTORY_MANAGER)).pipe(map((value) => Boolean(value)));
    }

    public addPrepa(): Observable<any> {
        return from(this.storage.get(StorageService.NB_PREPS)).pipe(
            flatMap((nbPrepas) => from(this.storage.set(StorageService.NB_PREPS, nbPrepas + 1))),
            map(() => undefined)
        );
    }
}
