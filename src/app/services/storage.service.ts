import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Article } from "../entities/article";
import { Mouvement } from "../entities/mouvement";
import { Emplacement } from "../entities/emplacement";

const MOUVEMENT_KEY = 'mouvement';
const ARTICLE_KEY = 'article';
const EMPLACEMENT_KEY = 'emplacement';
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

    // CREATE
    addMouvement(item: Mouvement): Promise<any> {
        return this.storage.get(MOUVEMENT_KEY).then((items: Mouvement[]) => {
            if (items) {
                items.push(item);
                return this.storage.set(MOUVEMENT_KEY, items);
            } else {
                return this.storage.set(MOUVEMENT_KEY, [item]);
            }
        });
    }

    // READ
    getMouvements(): Promise<Mouvement[]> {
        return this.storage.get(MOUVEMENT_KEY);
    }

    // UPDATE
    updateMouvement(item: Mouvement): Promise<any> {
        return this.storage.get(MOUVEMENT_KEY).then((items: Mouvement[]) => {
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

            return this.storage.set(MOUVEMENT_KEY, newItems);
        });
    }

    // DELETE
    deleteMouvement(id: number): Promise<Mouvement> {
        return this.storage.get(MOUVEMENT_KEY).then((items: Mouvement[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let toKeep: Mouvement[] = [];

            for (let i of items) {
                if (i.id !== id) {
                    toKeep.push(i);
                }
            }
            return this.storage.set(MOUVEMENT_KEY, toKeep);
        });
    }



    // CREATE
    addArticle(item: Article): Promise<any> {
        // console.log(this.storage.get(ARTICLE_KEY));
        return this.storage.get(ARTICLE_KEY).then((items: Article[]) => {
            if (items) {
                console.log(item);
                items.push(item);
                console.log(items);
                return this.storage.set(ARTICLE_KEY, items);
            } else {
                return this.storage.set(ARTICLE_KEY, [item]);
            }
        });
    }

    // CREATE MULTIPLE
    loadArticles(items: Article[]): Promise<any> {
        return this.storage.get(ARTICLE_KEY).then((articles: Article[]) => {
            if (!articles) articles = [];

            items.forEach(function(item) {
                articles.push(item);
            });
            return this.storage.set(ARTICLE_KEY, articles);
        });
    }

    // READ
    getArticles(): Promise<Article[]> {
        return this.storage.get(ARTICLE_KEY);
    }

    // getArticle(id: number): Promise<Article[]> {
    //     return this.storage.get(ARTICLE_KEY).then(items)
    // }

    // UPDATE
    updateArticle(item: Article): Promise<any> {
        return this.storage.get(ARTICLE_KEY).then((items: Article[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let newItems: Article[] = [];

            for (let i of items) {
                if (i.id === item.id) {
                    newItems.push(item);
                } else {
                    newItems.push(i);
                }
            }

            return this.storage.set(ARTICLE_KEY, newItems);
        });
    }

    // DELETE
    deleteArticle(id: number): Promise<Article> {
        return this.storage.get(ARTICLE_KEY).then((items: Article[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let toKeep: Article[] = [];

            for (let i of items) {
                if (i.id !== id) {
                    toKeep.push(i);
                }
            }
            return this.storage.set(ARTICLE_KEY, toKeep);
        });
    }


    // CREATE
    addEmplacement(item: Emplacement): Promise<any> {
        return this.storage.get(EMPLACEMENT_KEY).then((items: Emplacement[]) => {
            if (items) {
                items.push(item);
                return this.storage.set(EMPLACEMENT_KEY, items);
            } else {
                return this.storage.set(EMPLACEMENT_KEY, [item]);
            }
        });
    }

    // CREATE MULTIPLE
    loadEmplacements(items: Emplacement[]): Promise<any> {
        return this.storage.get(EMPLACEMENT_KEY).then((emplacements: Emplacement[]) => {
            if (!emplacements) emplacements = [];

            items.forEach(function(item) {
                emplacements.push(item);
            });
            return this.storage.set(EMPLACEMENT_KEY, emplacements);
        });
    }

    // READ
    getEmplacements(): Promise<Emplacement[]> {
        return this.storage.get(EMPLACEMENT_KEY);
    }

    // UPDATE
    updateEmplacement(item: Emplacement): Promise<any> {
        return this.storage.get(EMPLACEMENT_KEY).then((items: Emplacement[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let newItems: Emplacement[] = [];

            for (let i of items) {
                if (i.id === item.id) {
                    newItems.push(item);
                } else {
                    newItems.push(i);
                }
            }

            return this.storage.set(EMPLACEMENT_KEY, newItems);
        });
    }

    // DELETE
    deleteEmplacement(id: number): Promise<Emplacement> {
        return this.storage.get(EMPLACEMENT_KEY).then((items: Emplacement[]) => {
            if (!items || items.length === 0) {
                return null;
            }

            let toKeep: Emplacement[] = [];

            for (let i of items) {
                if (i.id !== id) {
                    toKeep.push(i);
                }
            }
            return this.storage.set(EMPLACEMENT_KEY, toKeep);
        });
    }
}