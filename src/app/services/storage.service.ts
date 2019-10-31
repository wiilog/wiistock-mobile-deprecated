import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';


const API_KEY = 'api-key';
const INVENTORY_MANAGER = 'inventory-manager';
const OPERATEUR = 'operateur';
const NB_PREPS = 'prep';

@Injectable()
export class StorageService {

    constructor(private storage: Storage) {
    }

    setApiKey(apiKey: string) {
        this.storage.set(API_KEY, apiKey);
    }

    setInventoryManagerRight(right: number) {
        this.storage.set(INVENTORY_MANAGER, right);
    }

    setPreps() {
        return this.storage.set(NB_PREPS, 0);
    }

    setOperateur(operateur) {
        return this.storage.set(OPERATEUR, operateur);
    }

    getOperateur() {
        return this.storage.get(OPERATEUR);
    }

    getPreps() {
        return this.storage.get(NB_PREPS);
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
        return new Promise<boolean>((resolve, reject) => {
            this.storage.get(key).then(data => {
                console.log('data ' + data + ' for key ' + key);
                if (data && data > 0) resolve(data);
                if (!data || data === 0) resolve(false);
            });
        });
    }

    public setDeposeValue(value: string, number: number) {
        return this.storage.get(value).then(data => {
            console.log(data);
            if (data) {
                if (data - number >= 0) {
                    console.log('set depose value ' + value + ' ' + (data-number));
                    this.storage.set(value, data - number);
                } else if (data - number < 0) {
                    console.log('set depose value ' + value + ' 0');
                    this.storage.set(value, 0);
                }
            }
        });
    }

    public async prisesAreUnfinished() {
        return new Promise<boolean>((resolve, reject) => {
            let length : number;
            this.storage.length().then((value) => {
                length = value;
            });
            this.storage.forEach((value: any, key: string, iterationNumber: Number) => {
                if (value >= 1 && key !== API_KEY && key !== OPERATEUR && key !== INVENTORY_MANAGER && key !== NB_PREPS) {
                    resolve(true);
                }
                if (iterationNumber === length) {
                    console.log(false);
                    resolve(false);
                }
            });
        });
    }

    getApiKey() {
        return this.storage.get(API_KEY);
    }

    getInventoryManagerRight() {
        return this.storage.get(INVENTORY_MANAGER);
    }

    clear() {
        return this.storage.clear();
    }

    addPrep() {
        return new Promise<any>((resolve) => {
            this.storage.get(NB_PREPS).then((nb_preps) => {
                this.storage.set(NB_PREPS, nb_preps + 1).then(() => {
                    resolve();
                });
            })
        });
    }
}
