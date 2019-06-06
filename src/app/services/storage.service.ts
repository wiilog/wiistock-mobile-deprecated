import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';


const API_KEY = 'api-key';
const OPERATEUR = 'operateur';

@Injectable()
export class StorageService {

    constructor(private storage: Storage) {
    }

    setApiKey(apiKey: string) {
        this.storage.set(API_KEY, apiKey);
    }

    setOperateur(operateur) {
        this.storage.set(OPERATEUR, operateur);
    }

    getOperateur() {
        return this.storage.get(OPERATEUR);
    }

    public setPriseValue(value: string, number: number) {
        return this.storage.get(value).then(data => {
            if (!data) {
                console.log('set prise value ' + value + ' ' + number);
                this.storage.set(value, number);
            }
            if (data) {
                console.log('set prise value ' + value + ' ' + (data + number));
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
                if (value >= 1 && key !== API_KEY) {
                    console.log(true);
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

    clear() {
        return this.storage.clear();
    }

}