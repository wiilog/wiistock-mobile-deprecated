import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Storage } from '@ionic/storage';



/*
  Generated class for the UsersApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsersApiProvider {

  private baseUrl: string = 'http://localhost:8000/api/test';
  // private baseUrl: string = 'http://localhost/users';

  constructor(public http: HttpClient, public storage: Storage) {
    console.log('API Users');
  }

  setProvider(options):Observable<any> {
    return this.http.post(this.baseUrl, JSON.stringify(options));
  }

  getAllUsers() {
    return this.storage.get('users');
  }

}
