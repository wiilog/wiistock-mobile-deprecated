import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {StorageService} from '@app/services/storage.service';
import {HttpClient} from '@angular/common/http';
import {of} from "rxjs/observable/of";

@Injectable()
export class ApiService {
    public static readonly GET_NOMADE_VERSIONS: string = '/nomade-versions';
    public static readonly GET_PING: string = '/ping';

    public static readonly BEGIN_PREPA: string = '/beginPrepa';
    public static readonly FINISH_PREPA: string = '/finishPrepa';
    public static readonly BEGIN_LIVRAISON: string = '/beginLivraison';
    public static readonly FINISH_LIVRAISON: string = '/finishLivraison';
    public static readonly BEGIN_COLLECTE: string = '/beginCollecte';
    public static readonly FINISH_COLLECTE: string = '/finishCollecte';
    public static readonly TREAT_ANOMALIES: string = '/treatAnomalies';
    public static readonly CONNECT: string = '/connect';
    public static readonly ADD_INVENTORY_ENTRIES: string = '/addInventoryEntries';
    public static readonly POST_MOUVEMENT_TRACA: string = '/mouvements-traca';
    public static readonly VALIDATE_MANUT: string = '/validateManut';
    public static readonly GET_DATA: string = '/getData';
    public static readonly NEW_EMP: string = '/emplacement';
    public static readonly GET_ARTICLES: string = '/articles';

    // time out for service verification and url ping, 10s
    public static readonly VERIFICATION_SERVICE_TIMEOUT: number = 10000;


    public constructor(private sqliteProvider: SqliteProvider,
                       private storageService: StorageService,
                       private httpClient: HttpClient) {}


    public requestApi(method: string,
                      service: string,
                      params: {[x: string]: any} = {}, secured: boolean = true): Observable<any> {
        const storageDataArray$ = [
            this.getApiUrl(service),
            ...(secured ? [this.storageService.getApiKey()] : [])
        ];

        params = ApiService.ObjectToHttpParams(params);

        return Observable.zip(...storageDataArray$)
            .pipe(
                flatMap(([url, apiKey]) => {
                    const keyParam = (method === 'get' || method === 'delete')
                        ? 'param'
                        : 'body';

                    const tmpParams = {
                        ...(secured ? {apiKey} : {}),
                        ...params
                    };
                    let smartParams = (method === 'post')
                        ? ApiService.ObjectToFormData(tmpParams)
                        : tmpParams;

                    const options = {
                        [keyParam]: smartParams,
                        responseType: 'json' as 'json'
                    };

                    return this.httpClient.request(method, url, options);
                })
            );
    }


    public getApiBaseUrl(newUrl?: string): Observable<any> {
        return newUrl
            ? of(`${newUrl}/api`)
            : this.sqliteProvider.getServerUrl().pipe(map((url) => (url ? `${url}/api` : null)));
    }

    public getApiUrl(service: string, newUrl?: string): Observable<any> {
        return this.getApiBaseUrl(newUrl).pipe(map((baseUrl) => (baseUrl ? `${baseUrl}${service}` : null)));
    }

    private static ObjectToFormData(object: {[x: string]: string}): FormData {
        const formData = new FormData();
        Object
            .keys(object)
            .forEach((key) => {
                formData.set(key, object[key])
            });
        return formData;
    }

    private static ObjectToHttpParams(object: {[x: string]: any}): {[x: string]: string|number} {
        return Object
            .keys(object)
            .reduce((acc, key) => ({
                ...acc,
                [key]: ((typeof object[key] !== 'string') && (typeof object[key] !== 'number') && !(object[key] instanceof Blob))
                    ? JSON.stringify(object[key])
                    : object[key]
            }), {});
    }
}
