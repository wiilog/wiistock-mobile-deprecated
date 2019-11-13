import {Injectable} from '@angular/core';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ApiServices} from '@app/config/api-services';
import {Observable} from 'rxjs/Observable';
import {flatMap, map} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {StorageService} from '@app/services/storage.service';
import {AlertController} from 'ionic-angular';
import 'rxjs/add/observable/zip';


@Injectable()
export class LocalDataManagerService {

    public constructor(private sqliteProvider: SqliteProvider,
                       private storageService: StorageService,
                       private httpClient: HttpClient,
                       private alertController: AlertController) {
    }


    public requestApi(method: string, service: string, params: {[x: string]: string}): Observable<any> {
        return Observable.zip(
            this.sqliteProvider.getApiUrl(service),
            this.storageService.getApiKey()
        )
            .pipe(
                flatMap(([url, apiKey]) => {
                    const keyParam = (method === 'get' || method === 'delete')
                        ? 'param'
                        : 'body';
                    const options = {
                        [keyParam]: {
                            apiKey,
                            ...params
                        },
                        responseType: 'json' as 'json'
                    };

                    return this.httpClient.request(method, url, options);
                })
            );
    }

    /**
     * Send all preparations in local database to the api
     */
    public saveFinishedPrepas(): Observable<any> {
        return Observable.zip(
            this.sqliteProvider.findAll('`preparation`'),
            this.sqliteProvider.findAll('`mouvement`')
        )
            .pipe(
                map(([preparations, mouvements]) => ([
                    preparations.filter(p => p.date_end !== null),
                    mouvements.filter(m => m.id_livraison === null)
                ])),
                map(([preparations, mouvements]) => (
                    preparations
                        .filter(p => p.date_end !== null)
                        .map((preparation) => ({
                            ...preparation,
                            mouvements: mouvements.filter((mouvement) => mouvement.id_prepa === preparation.id)
                        }))
                )),
                flatMap((preparations) => this.requestApi('post', ApiServices.FINISH_PREPA, {preparations})),
                flatMap((res) => {
                    const {success, errors} = res;
                    if (errors && errors.length > 0) {
                        this.presentAlertError(errors);
                    }
                    return Observable
                        .zip(
                            this.deleteSucceedPreparations(success),
                            this.resetFailedPreparations(errors)
                        )
                        .pipe(map(() => res));
                })
            );
    }

    private presentAlertError(errors: Array<{numero_prepa: string, message: string}>): void {
        this.alertController
            .create({
                title: `Des préparations n'ont pas pu être synchronisées`,
                message: errors.map(({numero_prepa, message}) => `${numero_prepa} : ${message}`).join(`\n`),
                buttons: [{
                    text: 'Valider',
                    cssClass: 'alertAlert'
                }]
            })
            .present();
    }

    private deleteSucceedPreparations(resSuccess): Observable<any> {
        const idsToDelete = resSuccess.map(({id_prepa}) => id_prepa);

        return Observable.zip(
            this.sqliteProvider.deletePreparationsById(idsToDelete),
            this.sqliteProvider.deleteMouvementsByPrepa(idsToDelete)
        );
    }

    private resetFailedPreparations(resError): Observable<any> {
        const idsToDelete = resError.map(({id_prepa}) => id_prepa);

        return Observable.zip(
            this.sqliteProvider.resetFinishedPrepas(idsToDelete),
            this.sqliteProvider.resetArticlePrepaByPrepa(idsToDelete),
            this.sqliteProvider.deleteMouvementsByPrepa(idsToDelete)
        );
    }
}
