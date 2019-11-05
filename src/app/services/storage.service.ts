import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {Observable} from 'rxjs';
import {from} from 'rxjs/observable/from';
import {flatMap, map} from 'rxjs/operators';
import {of} from 'rxjs/observable/of';


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

    public setPriseValue(value: string, number: number) {
        return this.storage.get(value).then(data => {
            if (!data) {
                this.storage.set(value, number);
            }
            else {
                this.storage.set(value, data + number);
            }
        });
    }

    public keyExists(key) {
        return from(this.storage.get(key)).pipe(
            map((data) => (
                (data && data > 0)
                    ? data
                    : false
            ))
        );
    }

    public setDeposeValue(value: string, number: number) {
        return from(this.storage.get(value)).pipe(flatMap((data) => {
            const res = (data - number);
            return (
                data
                    ? from(this.storage.set(value, (res >= 0 ? res : 0)))
                    : of(undefined)
            )
        }));
    }

    public prisesAreUnfinished(): Observable<boolean> {
        let isUnfinished: boolean = false;
        return from(this.storage.forEach((value: any, key: string) => {
            if (!isUnfinished &&
                (value >= 1) &&
                (key !== StorageService.API_KEY) &&
                (key !== StorageService.OPERATEUR) &&
                (key !== StorageService.INVENTORY_MANAGER) &&
                (key !== StorageService.NB_PREPS)) {
                isUnfinished = true;
            }
        })).pipe(map(() => isUnfinished));
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
