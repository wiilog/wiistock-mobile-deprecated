import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable, of, throwError, zip} from 'rxjs';
import {StorageService} from '@app/common/services/storage.service';
import {catchError, filter, flatMap, map, tap, timeout} from "rxjs/operators";
import {UserService} from "@app/common/services/user.service";


@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public static readonly GET_NOMADE_VERSIONS: string = '/nomade-versions';
    public static readonly GET_PING: string = '/ping';

    public static readonly BEGIN_PREPA: string = '/beginPrepa';
    public static readonly FINISH_PREPA: string = '/finishPrepa';
    public static readonly BEGIN_LIVRAISON: string = '/beginLivraison';
    public static readonly FINISH_LIVRAISON: string = '/finishLivraison';
    public static readonly BEGIN_COLLECTE: string = '/beginCollecte';
    public static readonly FINISH_COLLECTE: string = '/finishCollecte';
    public static readonly FINISH_TRANSFER: string = '/transfer/finish';
    public static readonly TREAT_ANOMALIES: string = '/treatAnomalies';
    public static readonly POST_API_KEY: string = '/api-key';
    public static readonly ADD_INVENTORY_ENTRIES: string = '/addInventoryEntries';
    public static readonly POST_MOUVEMENT_TRACA: string = '/mouvements-traca';
    public static readonly POST_HANDLING: string = '/handlings';
    public static readonly GET_DATA: string = '/getData';
    public static readonly NEW_EMP: string = '/emplacement';
    public static readonly GET_ARTICLES: string = '/articles';
    public static readonly GET_TRACKING_DROPS: string = '/tracking-drops';
    public static readonly POST_DEMANDE_LIVRAISON: string = '/valider-dl';
    public static readonly GET_DEMANDE_LIVRAISON_DATA: string = '/demande-livraison-data';
    public static readonly GET_PACK_NATURE: string = '/packs/{code}/nature';
    public static readonly PATCH_DISPATCH: string = '/dispatches';

    private static readonly DEFAULT_HEADERS = {
        'X-Requested-With': 'XMLHttpRequest'
    };

    // time out for service verification and url ping, 10s
    private static readonly VERIFICATION_SERVICE_TIMEOUT: number = 10000;


    public constructor(private storageService: StorageService,
                       private httpClient: HttpClient,
                       private userService: UserService) {
    }

    public pingApi(url: string): Observable<any> {
        return this.httpClient
            .get(url, {headers: ApiService.DEFAULT_HEADERS})
            .pipe(timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT));
    }

    public requestApi(method: string,
                      service: string,
                      {params = {}, secured = true, timeout: requestWithTimeout = false, pathParams = {}}: {
                          params?: { [x: string]: any };
                          pathParams?: { [x: string]: string|number };
                          secured?: boolean;
                          timeout?: boolean;
                      } = {params: {}, pathParams: {}, secured: true, timeout: false}): Observable<any> {
        params = ApiService.ObjectToHttpParams(params);

        let requestResponse = zip(
            this.getApiUrl(service, {pathParams}),
            ...(secured ? [this.storageService.getApiKey()] : [])
        )
            .pipe(
                tap(([url]) => {
                    if (!url) {
                        throw new Error('The api url is not set');
                    }
                }),
                flatMap(([url, apiKey]: [string, string]) => {
                    const keyParam = (method === 'get' || method === 'delete')
                        ? 'params'
                        : 'body';

                    let smartParams = (method === 'post')
                        ? ApiService.ObjectToFormData(params)
                        : params;

                    const options = {
                        [keyParam]: smartParams,
                        responseType: 'json' as 'json',
                        observe: 'response' as 'response',
                        headers: {
                            ...(secured && apiKey ? {"X-Authorization": `Bearer ${apiKey}`} : {}),
                            ...ApiService.DEFAULT_HEADERS
                        }
                    };

                    return this.httpClient.request(method, url, options);
                }),
                catchError(
                    (response: HttpResponse<any>) => {
                        if(response.status == 401) {
                            this.userService.doLogout();
                            return of(response);
                        }
                        else {
                            return throwError(response);
                        }
                    }
                ),
                filter((response: HttpResponse<any>) => (response.status != 401)),
                map((response: HttpResponse<any>) => response.body)
            );

        if (requestWithTimeout) {
            requestResponse = requestResponse.pipe(timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT));
        }

        return requestResponse;
    }


    public getApiBaseUrl(newUrl?: string): Observable<any> {
        return newUrl
            ? of(`${newUrl}/api`)
            : this.storageService.getServerUrl().pipe(map((url) => (url ? `${url}/api` : null)));
    }

    public getApiUrl(service: string, {newUrl, pathParams = {}}: { newUrl?: string, pathParams?: { [x: string]: string | number } } = {}): Observable<any> {
        for(let pathParamName in pathParams) {
            const regexMatchParam = new RegExp(`\{${pathParamName}\}`, 'g');
            service = service.replace(regexMatchParam, encodeURIComponent(pathParams[pathParamName]));
        }

        return this.getApiBaseUrl(newUrl).pipe(map((baseUrl) => (baseUrl ? `${baseUrl}${service}` : null)));
    }

    private static ObjectToFormData(object: { [x: string]: string }): FormData {
        const formData = new FormData();
        Object
            .keys(object)
            .forEach((key) => {
                formData.set(key, object[key])
            });
        return formData;
    }

    private static ObjectToHttpParams(object: { [x: string]: any }): { [x: string]: string | number } {
        return Object
            .keys(object)
            .reduce((acc, key) => ({
                ...acc,
                [key]: ((typeof object[key] !== 'string') && (typeof object[key] !== 'number') && !(object[key] instanceof Blob))
                    ? JSON.stringify(object[key])
                    : object[key]
            }), {});
    }

    private check
}
