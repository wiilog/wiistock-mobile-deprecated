import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import {SqliteProvider} from "../../providers/sqlite/sqlite";


@Injectable()
export class UsersApiProvider {

  constructor(public http: HttpClient, public sqlProvider : SqliteProvider) {
  }

  setProvider(options, url):Observable<any> {
        return this.http.post(url, options);
  };

}
