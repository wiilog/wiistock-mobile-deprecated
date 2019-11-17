import {Injectable} from '@angular/core';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ApiService} from '@app/services/api.service';
import {Observable} from 'rxjs/Observable';
import {flatMap, map} from 'rxjs/operators';
import {AlertController} from 'ionic-angular';
import 'rxjs/add/observable/zip';
import {ReplaySubject} from 'rxjs';
import {of} from "rxjs/observable/of";
import {AlertManagerService} from "@app/services/alert-manager.service";
import {Preparation} from "@app/entities/preparation";
import {Mouvement} from "@app/entities/mouvement";
import {Livraison} from "@app/entities/livraison";
import {Collecte} from "@app/entities/collecte";


type Process = 'preparation' | 'livraison' | 'collecte';
interface ApiProccessConfig {
    service: string;
    createApiParams: () => Observable<{paramName: string, [name: string]: any}>

    // after api submit
    deleteSucceed: (resSuccess: any) => Observable<any>;
    resetFailed: (resError: any) => Observable<any>;
    titleErrorAlert: string;
    numeroProccessFailed: string;
}

@Injectable()
export class LocalDataManagerService {

    private readonly apiProccessConfigs: {[type in Process]: ApiProccessConfig};

    public constructor(private sqliteProvider: SqliteProvider,
                       private apiService: ApiService,
                       private alertManager: AlertManagerService,
                       private alertController: AlertController) {
        this.apiProccessConfigs = {
            preparation: {
                service: ApiService.FINISH_PREPA,
                createApiParams: () => (
                    Observable.zip(
                        this.sqliteProvider.findAll('`preparation`'),
                        this.sqliteProvider.findAll('`mouvement`')
                    )
                        .pipe(
                            map(([preparations, mouvements]: [Array<Preparation>, Array<Mouvement>]) => ([
                                preparations.filter(({date_end}) => date_end),
                                mouvements.filter(({id_prepa}) => id_prepa)
                            ])),
                            map(([preparations, mouvements]: [Array<Preparation>, Array<Mouvement>]) => ({
                                paramName: 'preparations',
                                preparations: preparations
                                    .map((preparation) => ({
                                        ...preparation,
                                        mouvements: mouvements.filter(({id_prepa}) => (id_prepa === preparation.id))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des préparations n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_prepa',
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_prepa}) => id_prepa);

                    return Observable.zip(
                        this.sqliteProvider.deletePreparationsById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_prepa', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_prepa}) => id_prepa);
                    return Observable.zip(
                        this.sqliteProvider.resetFinishedPrepas(idsToDelete),
                        this.sqliteProvider.resetArticlePrepaByPrepa(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_prepa', idsToDelete)
                    );
                }
            },
            livraison: {
                service: ApiService.FINISH_LIVRAISON,
                createApiParams: () => (
                    Observable.zip(
                        this.sqliteProvider.findAll('`livraison`'),
                        this.sqliteProvider.findAll('`mouvement`')
                    )
                        .pipe(
                            map(([livraisons, mouvements]: [Array<Livraison>, Array<Mouvement>]) => ([
                                livraisons.filter(({date_end}) => date_end),
                                mouvements.filter(({id_livraison}) => id_livraison)
                            ])),
                            map(([livraisons, mouvements]: [Array<Livraison>, Array<Mouvement>]) => ({
                                paramName: 'livraisons',
                                livraisons: livraisons
                                    .map((livraison) => ({
                                        ...livraison,
                                        mouvements: mouvements.filter(({id_livraison}) => (id_livraison === livraison.id))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des livraisons n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_livraison',
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_prepa}) => id_prepa);

                    return Observable.zip(
                        this.sqliteProvider.deleteLivraionsById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_livraison', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_livraison}) => id_livraison);
                    return Observable.zip(
                        this.sqliteProvider.deleteLivraionsById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_livraison', idsToDelete)
                    );
                }
            },
            collecte: {
                service: ApiService.FINISH_COLLECTE,
                createApiParams: () => (
                    Observable.zip(
                        this.sqliteProvider.findAll('`collecte`'),
                        this.sqliteProvider.findAll('`mouvement`')
                    )
                        .pipe(
                            map(([collectes, mouvements]: [Array<Collecte>, Array<Mouvement>]) => ([
                                collectes.filter(({date_end}) => date_end),
                                mouvements.filter(({id_collecte}) => id_collecte)
                            ])),
                            map(([collectes, mouvements]: [Array<Collecte>, Array<Mouvement>]) => ({
                                paramName: 'collectes',
                                collectes: collectes
                                    .map((collecte) => ({
                                        ...collecte,
                                        mouvements: mouvements.filter(({id_collecte}) => (id_collecte === collecte.id))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des livraisons n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_collecte',
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_prepa}) => id_prepa);

                    return Observable.zip(
                        this.sqliteProvider.deleteLivraionsById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_collecte}) => id_collecte);
                    return Observable.zip(
                        this.sqliteProvider.deleteCollecteById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                }
            }
        }
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
                    return this.saveFinishedProcess('preparation');
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
    public saveFinishedProcess(process: Process): Observable<{success: any, error: any}> {
        const apiProccessConfig = this.apiProccessConfigs[process];
        return apiProccessConfig.createApiParams()
            .pipe(
                flatMap(({paramName, ...params}) => (
                    (params[paramName] && params[paramName].length > 0)
                        ? this.apiService.requestApi('post', apiProccessConfig.service, params).pipe(
                            flatMap((res) => {
                                const {success, errors} = res;
                                if (errors && errors.length > 0) {
                                    this.presentAlertError(
                                        apiProccessConfig.titleErrorAlert,
                                        apiProccessConfig.numeroProccessFailed,
                                        errors
                                    );
                                }
                                return Observable
                                    .zip(
                                        apiProccessConfig.deleteSucceed(success),
                                        apiProccessConfig.resetFailed(errors)
                                    )
                                    .pipe(map(() => res));
                            })
                        )
                        : of(false)
                ))
            );
    }

    private presentAlertError(title: string, numeroFailedName: string, errors: Array<{[numeros: string]: string, message: string}>): void {
        this.alertController
            .create({
                title,
                cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
                message: errors.map(({message, ...numeros}) => `${numeros[numeroFailedName]} : ${message}`).join(`\n`),
                buttons: [{
                    text: 'Valider',
                    cssClass: 'alertAlert'
                }]
            })
            .present()
            .then(() => {
                this.alertManager.breakMessageLines();
            });
    }
}
