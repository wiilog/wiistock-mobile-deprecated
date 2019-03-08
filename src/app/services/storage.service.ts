import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

export interface Mouvement {
    id: number,
    type: string,
    articles: number[],
    emplacement: string
}

const ITEMS_KEY = 'my-items';

@Injectable()
export class StorageService {

    constructor(private storage: Storage) { }

    // CREATE
    addMouvement(item: Mouvement): Promise<any> {
        return this.storage.get(ITEMS_KEY).then((items: Mouvement[]) => {
            if (items) {
                items.push(item);
                return this.storage.set(ITEMS_KEY, items);
            } else {
                return this.storage.set(ITEMS_KEY, [item]);
            }
        });
    }

    // READ
    getMouvements(): Promise<Mouvement[]> {
        return this.storage.get(ITEMS_KEY);
    }

    // UPDATE
    updateMouvement(item: Mouvement): Promise<any> {
        return this.storage.get(ITEMS_KEY).then((items: Mouvement[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let newItems: Mouvement[] = [];

            for (let i of items) {
                if (i.id === item.id) {
                    newItems.push(item);
                } else {
                    newItems.push(i);
                }
            }

            return this.storage.set(ITEMS_KEY, newItems);
        });
    }

    // DELETE
    deleteMouvement(id: number): Promise<Mouvement> {
        return this.storage.get(ITEMS_KEY).then((items: Mouvement[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let toKeep: Mouvement[] = [];

            for (let i of items) {
                if (i.id !== id) {
                    toKeep.push(i);
                }
            }
            return this.storage.set(ITEMS_KEY, toKeep);
        });
    }
}