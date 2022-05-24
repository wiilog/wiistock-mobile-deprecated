import {Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {from, Observable, of, throwError, zip} from 'rxjs';
import {StorageService} from '@app/common/services/storage/storage.service';
import {catchError, filter, flatMap, map, tap, timeout} from "rxjs/operators";
import {UserService} from "@app/common/services/user.service";
import {AppVersion} from '@ionic-native/app-version/ngx';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';

const GET = 'get';
const POST = 'post';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public static readonly GET_NOMADE_VERSIONS = {method: GET, service: '/nomade-versions'};
    public static readonly GET_PING = {method: GET, service: '/ping'};

    public static readonly BEGIN_PREPA = {method: POST, service: '/beginPrepa'};
    public static readonly FINISH_PREPA = {method: POST, service: '/finishPrepa'};
    public static readonly BEGIN_LIVRAISON = {method: POST, service: '/beginLivraison'};
    public static readonly FINISH_LIVRAISON = {method: POST, service: '/finishLivraison'};
    public static readonly BEGIN_COLLECTE = {method: POST, service: '/beginCollecte'};
    public static readonly FINISH_COLLECTE = {method: POST, service: '/finishCollecte'};
    public static readonly FINISH_TRANSFER = {method: POST, service: '/transfer/finish'};
    public static readonly TREAT_ANOMALIES = {method: POST, service: '/treatAnomalies'};
    public static readonly POST_API_KEY = {method: POST, service: '/api-key'};
    public static readonly ADD_INVENTORY_ENTRIES = {method: POST, service: '/addInventoryEntries'};
    public static readonly POST_TRACKING_MOVEMENTS = {method: POST, service: '/tracking-movements'};
    public static readonly POST_STOCK_MOVEMENTS = {method: POST, service: '/stock-movements'};
    public static readonly POST_HANDLING = {method: POST, service: '/handlings'};
    public static readonly GET_DATA = {method: POST, service: '/getData'};
    public static readonly GET_PREVIOUS_OPERATOR_MOVEMENTS = {method: GET, service: '/previous-operator-movements'};
    public static readonly NEW_EMP = {method: POST, service: '/emplacement'};
    public static readonly GET_ARTICLES = {method: GET, service: '/articles'};
    public static readonly GET_TRACKING_DROPS = {method: GET, service: '/tracking-drops'};
    public static readonly POST_DEMANDE_LIVRAISON = {method: POST, service: '/valider-dl'};
    public static readonly GET_DEMANDE_LIVRAISON_DATA = {method: GET, service: '/demande-livraison-data'};
    public static readonly GET_PACK_DATA = {method: GET, service: '/packs'};
    public static readonly PATCH_DISPATCH = {method: POST, service: '/dispatches'};
    public static readonly GET_SERVER_IMAGES = {method: GET, service: '/server-images'};
    public static readonly PACKS_GROUPS = {method: GET, service: '/pack-groups'};
    public static readonly GROUP = {method: POST, service: '/group'};
    public static readonly UNGROUP = {method: POST, service: '/ungroup'};
    public static readonly POST_GROUP_TRACKINGS = {method: POST, service: '/group-trackings/{mode}'};
    public static readonly POST_EMPTY_ROUND = {method: POST, service: '/empty-round'};
    public static readonly GET_COLLECTABLE_ARTICLES = {method: GET, service: '/collectable-articles'};
    public static readonly GET_TRANSPORT_ROUNDS = {method: GET, service: '/transport-rounds'};
    public static readonly GET_REJECT_MOTIVES = {method: GET, service: '/reject-motives'};
    public static readonly REJECT_PACK = {method: POST, service: '/reject-pack'};
    public static readonly LOAD_PACKS = {method: POST, service: '/load-packs'};
    public static readonly FINISH_TRANSPORT = {method: POST, service: '/finish-transport'};
    public static readonly HAS_NEW_PACKS = {method: GET, service: '/has-new-packs'};
    public static readonly START_DELIVERY_ROUND = {method: POST, service: '/start-round'};

    private static readonly DEFAULT_HEADERS = {
        'X-Requested-With': 'XMLHttpRequest'
    };

    // time out for service verification and url ping, 10s
    private static readonly VERIFICATION_SERVICE_TIMEOUT: number = 10000;


    public constructor(private storageService: StorageService,
                       private appVersion: AppVersion,
                       private httpClient: HttpClient,
                       private userService: UserService) {
    }

    public pingApi(url: string): Observable<any> {
        return from(this.appVersion.getVersionNumber())
            .pipe(
                flatMap((currentVersion) => this.httpClient
                    .get(url, {
                        headers: {
                            'X-App-Version': currentVersion,
                            ...ApiService.DEFAULT_HEADERS
                        }
                    })
                ),
                timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT)
            );
    }

    public requestApi({method, service}: { method: string; service: string; },
                      {params = {}, secured = true, timeout: requestWithTimeout = false, pathParams = {}}: {
                          params?: { [x: string]: any };
                          pathParams?: { [x: string]: string|number };
                          secured?: boolean;
                          timeout?: boolean;
                      } = {params: {}, pathParams: {}, secured: true, timeout: false}): Observable<any> {
        params = ApiService.ObjectToHttpParams(params);

        let requestResponse = zip(
            this.getApiUrl({service}, {pathParams}),
            from(this.appVersion.getVersionNumber()),
            ...(secured ? [this.storageService.getString(StorageKeyEnum.API_KEY)] : [])
        )
            .pipe(
                tap(([url]) => {
                    if (!url) {
                        throw new Error('The api url is not set');
                    }
                }),
                flatMap(([url, currentVersion, apiKey]: [string, string, string]) => {
                    const keyParam = (method === GET || method === 'delete')
                        ? 'params'
                        : 'body';

                    let smartParams = (method === POST)
                        ? ApiService.ObjectToFormData(params)
                        : params;

                    const options = {
                        [keyParam]: smartParams,
                        responseType: 'json' as 'json',
                        observe: 'response' as 'response',
                        headers: {
                            'X-App-Version': currentVersion,
                            ...(secured && apiKey ? {"X-Authorization": `Bearer ${apiKey}`} : {}),
                            ...ApiService.DEFAULT_HEADERS
                        }
                    };

                    return this.httpClient.request(method, url, options);
                }),
                catchError((response: HttpResponse<any>) => {
                    if(response.status == 401) {
                        this.userService.doLogout();
                        return of(response);
                    }
                    else {
                        return throwError(response);
                    }
                }),
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
            : this.storageService.getString(StorageKeyEnum.URL_SERVER).pipe(map((url) => (url ? `${url}/api` : null)));
    }

    public getApiUrl({service}: {service: string},
                     {newUrl, pathParams = {}}: { newUrl?: string, pathParams?: { [x: string]: string | number } } = {}): Observable<any> {
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

}
