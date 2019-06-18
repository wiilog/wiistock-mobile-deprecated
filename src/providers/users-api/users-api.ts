import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from "rxjs";


@Injectable()
export class UsersApiProvider {

  private baseUrl: string = 'http://scs1-rec.follow-gt.fr/api/connect'; //TODO

  constructor(public http: HttpClient) {
  }

  setProvider(options):Observable<any> {
    return this.http.post(this.baseUrl, options);
  }

}
