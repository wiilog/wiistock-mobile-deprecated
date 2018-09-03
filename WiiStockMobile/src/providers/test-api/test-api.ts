import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


const httpOptions = {
	headers: new HttpHeaders({'Content-Type': 'application/json'})
};
const apiUrl = "http://10.1.0.122/WiiStock/WiiStock/public/index.php/tests";


@Injectable()
export class TestApiProvider {

  constructor(public http: HttpClient) {
    console.log('Hello TestApiProvider Provider');
  }

  /*private handleError(error: HttpErrorResponse) {
  	if (error.error instanceof ErrorEvent) {
  		// a client-side or network error occurred
  		console.error("An error occurred : ", error.error.message);
  	
  	} else {
  		// the backend returned an unsuccessful reponse code
  		console.error(
  			`Backend returned code ${error.status}, ` +
  			`body was : ${error.error}`);
  	}
  }*/


  private extractData(res: Response) {
  	let body = res;
  	return body || {};
  }

  getTest(): Observable<any> {
  	return this.http.get(apiUrl, httpOptions).pipe(
  		map(this.extractData));
  }

  getTestById(id: string): Observable<any> {
  	const url = `${apiUrl}/${id}`;
  	return this.http.get(url, httpOptions).pipe(
  		map(this.extractData));
  }


  postTest(data): Observable<any> {
  	return this.http.post(apiUrl, data, httpOptions);
  }

  updateTest(id: string, data): Observable<any> {
  	const url = `${apiUrl}/${id}`;
  	return this.http.put(url, data, httpOptions);
  }

  deleteTest(id: string): Observable<any> {
  	const url = `${apiUrl}/${id}`;
  	return this.http.delete(url, httpOptions);	
  }

}
