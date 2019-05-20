import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';


const API_KEY = 'api-key';

@Injectable()
export class StorageService {

    constructor(private storage: Storage) { }

    setApiKey(apiKey: string) {
        this.storage.set(API_KEY, apiKey);
    }

    getApiKey() {
        return this.storage.get(API_KEY);
    }

    clear() {
        this.storage.clear();
    }

}