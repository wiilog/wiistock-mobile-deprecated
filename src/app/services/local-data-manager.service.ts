import {Injectable} from '@angular/core';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ApiService} from '@app/services/api.service';
import {Observable} from 'rxjs/Observable';
import {flatMap, map} from 'rxjs/operators';
import {AlertController} from 'ionic-angular';
import 'rxjs/add/observable/zip';
import {ReplaySubject} from 'rxjs';
import {of} from "rxjs/observable/of";


@Injectable()
export class LocalDataManagerService {

    public constructor(private sqliteProvider: SqliteProvider,
                       private apiService: ApiService,
                       private alertController: AlertController) {
    }

    public synchroniseData(): Observable<{finished: boolean, message?: string}> {
        const synchronise$ = new ReplaySubject<{finished: boolean, message?: string}>(1);

        synchronise$.next({finished: false, message: 'Synchronisation des données en cours...'});
        this.apiService
            .requestApi('post', ApiService.GET_DATA)
            .pipe(
                flatMap(({data}) =>  this.sqliteProvider.importData(data)),
                flatMap(() => {
                    synchronise$.next({finished: false, message: 'Envoi des préparations non synchronisées'});
                    return this.saveFinishedPrepas();
                })
            )
            .subscribe(
                () => {
                    synchronise$.next({finished: true});
                    synchronise$.complete();
                },
                (error) => {
                    synchronise$.error(error);
                    synchronise$.complete();
                }
            );

        return synchronise$;
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
                flatMap((preparations) => (
                    (preparations && preparations.length > 0)
                        ? this.apiService.requestApi('post', ApiService.FINISH_PREPA, {preparations}).pipe(
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
                        )
                        : of(false)
                ))
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
