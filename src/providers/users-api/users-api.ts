import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

/*
  Generated class for the UsersApiProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsersApiProvider {

  private baseUrl: string = 'http://localhost/users.php';
  // private options : any = {
  //   'login': 'cegaz',
  //   'password': 'azerty'
  // }

  constructor(public http: HttpClient) {
    console.log('API Users');
  }

  setProvider(options):Observable<any> {
    return this.http.post(this.baseUrl, JSON.stringify(options));
  }

}
