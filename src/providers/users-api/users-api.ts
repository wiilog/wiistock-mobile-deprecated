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

  private baseUrl: string = 'http://51.77.202.108/api/test'; //TODO

  constructor(public http: HttpClient, public storage: Storage) {
  }

  setProvider(options):Observable<any> {
    return this.http.post(this.baseUrl, options);
  }

}
