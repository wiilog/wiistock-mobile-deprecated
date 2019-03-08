import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';

/*
  Generated class for the ArticlesProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
const STORAGE = 'articles';

@Injectable()
export class ArticlesProvider {

  id: number;
  ref: string;

  constructor(public http: HttpClient, public storage: Storage) {
    console.log('Hello ArticlesProvider Provider');
  }

  getAllArticles() {
    return this.storage.get(STORAGE);
  }

}
