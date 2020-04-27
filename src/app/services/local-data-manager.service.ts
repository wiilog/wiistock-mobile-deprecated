import {Injectable} from '@angular/core';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ApiService} from '@app/services/api.service';
import {Observable} from 'rxjs/Observable';
import {flatMap, map} from 'rxjs/operators';
import {AlertController} from 'ionic-angular';
import 'rxjs/add/observable/zip';
import {ReplaySubject, Subject} from 'rxjs';
import {of} from 'rxjs/observable/of';
import {AlertManagerService} from '@app/services/alert-manager.service';
import {Preparation} from '@app/entities/preparation';
import {Mouvement} from '@app/entities/mouvement';
import {Livraison} from '@app/entities/livraison';
import {Collecte} from '@app/entities/collecte';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import 'rxjs/add/observable/zip';
import {FileService} from "@app/services/file.service";
import {StorageService} from "@app/services/storage.service";


type Process = 'preparation' | 'livraison' | 'collecte' | 'inventory' | 'inventoryAnomalies';
interface ApiProccessConfig {
    service: string;
    createApiParams: () => Observable<{paramName: string, [name: string]: any}>

    // after api submit
    deleteSucceed: (resSuccess: any) => Observable<any>;
    resetFailed?: (resError: any) => Observable<any>;
    treatData?: (data: any) => Observable<any>;
    titleErrorAlert?: string;
    numeroProccessFailed?: string;
}

@Injectable()
export class LocalDataManagerService {

    private readonly apiProccessConfigs: {[type in Process]: ApiProccessConfig};

    public constructor(private sqliteProvider: SqliteProvider,
                       private apiService: ApiService,
                       private fileService: FileService,
                       private storageService: StorageService,
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
                },
                treatData: (data) => {
                    const {preparations} = data;
                    return (preparations && preparations.length > 0)
                        ? of(undefined).pipe(
                            flatMap(() => this.sqliteProvider.importPreparations(data, false)),
                            flatMap(() => this.sqliteProvider.importArticlesPrepas(data)),
                            flatMap(() => this.sqliteProvider.importArticlesPrepaByRefArticle(data, true))
                        )
                        : of(undefined)
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
                    const idsToDelete = resSuccess.map(({id_livraison}) => id_livraison);

                    return Observable.zip(
                        this.sqliteProvider.deleteLivraionsById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_livraison', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_livraison}) => id_livraison);
                    return Observable.zip(
                        this.sqliteProvider.resetFinishedLivraisons(idsToDelete),
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
                                        mouvements: mouvements
                                            .filter(({id_collecte}) => (id_collecte === collecte.id))
                                            .map(({is_ref, reference, quantity}) => ({is_ref, reference, quantity}))
                                    }))
                            }))
                        )
                ),
                titleErrorAlert: `Des livraisons n'ont pas pu être synchronisées`,
                numeroProccessFailed: 'numero_collecte',
                treatData: (data) => {
                    const dataToTreat = (data || {});

                    const newCollectes = (dataToTreat.newCollectes || []);
                    const articlesCollecte = (dataToTreat.articlesCollecte || []);
                    const stockTakings = (dataToTreat.stockTakings || []);

                    return (
                        (newCollectes.length > 0 || articlesCollecte.length > 0 || stockTakings.length > 0)
                            ? Observable.zip(
                                // import collecte
                                ...(newCollectes.map((newCollecte) => this.sqliteProvider.insert('collecte', newCollecte))),

                                // import articlesCollecte
                                ...(
                                    articlesCollecte.map((newArticleCollecte) => (
                                        this.sqliteProvider.executeQuery(
                                            this.sqliteProvider.getArticleCollecteInsertQuery([this.sqliteProvider.getArticleCollecteValueFromApi(newArticleCollecte)])
                                        )
                                    ))
                                ),

                                // import new mouvementsTraca
                                ...(stockTakings.map((taking) => this.sqliteProvider.insert('mouvement_traca', taking)))
                            )
                            : of(undefined)
                    );
                },
                deleteSucceed: (resSuccess) => {
                    const idsToDelete = resSuccess.map(({id_collecte}) => id_collecte);

                    return Observable.zip(
                        this.sqliteProvider.deleteCollecteById(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                },
                resetFailed: (resError) => {
                    const idsToDelete = resError.map(({id_collecte}) => id_collecte);
                    return Observable.zip(
                        this.sqliteProvider.resetFinishedCollectes(idsToDelete),
                        this.sqliteProvider.deleteMouvementsBy('id_collecte', idsToDelete)
                    );
                }
            },
            inventory: {
                service: ApiService.ADD_INVENTORY_ENTRIES,
                createApiParams: () => this.sqliteProvider.findAll('`saisie_inventaire`').pipe(map((entries) => ({
                    paramName: 'entries',
                    entries
                }))),
                treatData: ({anomalies}) => {
                    return (anomalies && anomalies.length > 0)
                        ? this.sqliteProvider.importAnomaliesInventaire({anomalies}, false)
                        : of(undefined);
                },
                deleteSucceed: () => this.sqliteProvider.deleteBy('saisie_inventaire')
            },
            inventoryAnomalies: {
                service: ApiService.TREAT_ANOMALIES,
                createApiParams: () => this.sqliteProvider.findBy('`anomalie_inventaire`', [`treated = '1'`]).pipe(map((anomalies) => ({
                    paramName: 'anomalies',
                    anomalies
                }))),
                deleteSucceed: () => this.sqliteProvider.deleteBy('anomalie_inventaire', '1', 'treated')
            }
        }
    }

    private static ShowSyncMessage(res$: Subject<any>) {
        res$.next({finished: false, message: 'Synchronisation des données en cours...'});
    }

    public synchroniseData(): Observable<{finished: boolean, message?: string}> {
        const synchronise$ = new ReplaySubject<{finished: boolean, message?: string}>(1);

        LocalDataManagerService.ShowSyncMessage(synchronise$);
        this.importData()
            .pipe(
                flatMap(() => {
                    synchronise$.next({finished: false, message: 'Envoi des préparations non synchronisées'});
                    return this.sendFinishedProcess('preparation').pipe(map(Boolean));
                }),
                flatMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des livraisons non synchronisées'});
                    return this.sendFinishedProcess('livraison').pipe(map((needAnotherSynchroniseLivraison) => needAnotherSynchronise || Boolean(needAnotherSynchroniseLivraison)));
                }),
                flatMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des collectes non synchronisées'});
                    return this.sendFinishedProcess('collecte').pipe(map((needAnotherSynchroniseCollecte) => needAnotherSynchronise || Boolean(needAnotherSynchroniseCollecte)));
                }),
                flatMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des prises et des déposes'});
                    return this.sendMouvementTraca(false).pipe(map(() => needAnotherSynchronise));
                }),
                flatMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des saisies d\'inventaire'});
                    return this.sendFinishedProcess('inventory').pipe(map(() => needAnotherSynchronise));
                }),
                flatMap((needAnotherSynchronise) => {
                    synchronise$.next({finished: false, message: 'Envoi des anomalies d\'inventaire'});
                    return this.sendFinishedProcess('inventoryAnomalies').pipe(map(() => needAnotherSynchronise));
                }),
                // we reload data from API if we have save data in previous requests
                flatMap((needAnotherSynchronise) => {
                    if (needAnotherSynchronise) {
                        LocalDataManagerService.ShowSyncMessage(synchronise$);
                    }
                    return needAnotherSynchronise ? this.importData() : of(false);
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

    public importData(): Observable<any> {
        return this.apiService
            .requestApi('post', ApiService.GET_DATA)
            .pipe(
                flatMap(({data}) => (
                    this.storageService
                        .updateRights(data.rights || {})
                        .pipe(map(() => ({data})))
                )),
                flatMap(({data}) => this.sqliteProvider.importData(data))
            );
    }

    public sendMouvementTraca(sendFromStock: boolean): Observable<any> {
        return this.sqliteProvider.findAll('mouvement_traca')
            .pipe(
                map((mouvements: Array<MouvementTraca>) => (
                    mouvements
                        .filter(({fromStock}) => (sendFromStock === Boolean(fromStock)))
                        .map(({signature, ...mouvement}) => ({
                            ...mouvement,
                            signature: signature
                                ? this.fileService.createFile(
                                    signature,
                                    FileService.SIGNATURE_IMAGE_EXTENSION,
                                    FileService.SIGNATURE_IMAGE_TYPE
                                )
                                : undefined
                        }))
                        .sort(({date: dateStr1}, {date: dateStr2}) => {
                            const date1 = new Date(dateStr1.split('_')[0]);
                            const date2 = new Date(dateStr2.split('_')[0]);
                            return date1.getTime() <= date2.getTime()
                                ? -1
                                : 1
                        })
                )),
                flatMap((mouvements: Array<MouvementTraca&{signature: File}>) => (
                    mouvements.length > 0
                        ? (
                            this.apiService
                                .requestApi('post', ApiService.POST_MOUVEMENT_TRACA, {
                                    params: {
                                        mouvements: mouvements.map(({signature, ...mouvements}) => mouvements),
                                        ...(mouvements.reduce((acc, {signature}, currentIndex) => ({
                                            ...acc,
                                            ...(signature ? {[`signature_${currentIndex}`]: signature} : {})
                                        }), {}))
                                    }
                                })
                                .pipe(
                                    map((apiResponse) => [apiResponse, mouvements]),
                                    flatMap(([apiResponse, mouvements]) => {
                                        const refArticlesErrors = Object.keys((apiResponse && apiResponse.data && apiResponse.data.errors) || {});
                                        return (
                                            (apiResponse && apiResponse.success)
                                                ? of(undefined)
                                                    .pipe(
                                                        // we delete succeed mouvement
                                                        flatMap(() => (
                                                            this.sqliteProvider
                                                                .deleteBy(
                                                                    'mouvement_traca',
                                                                    mouvements
                                                                        .filter(({finished, type, ref_article}) => (
                                                                            (finished && (refArticlesErrors.indexOf(ref_article) === -1)) ||
                                                                            (type === 'depose')
                                                                        ))
                                                                        .map(({id}) => id)
                                                                )
                                                        )),
                                                        flatMap(() => (
                                                            // we reset failed mouvement
                                                            this.sqliteProvider
                                                                .resetMouvementsTraca(
                                                                    refArticlesErrors,
                                                                    'prise',
                                                                    sendFromStock
                                                                )
                                                        )),
                                                        map(() => apiResponse)
                                                    )
                                                : of(undefined)
                                        );
                                    })
                                )
                        )
                        : of(undefined)
                ))
            );
    }

    public saveMouvementsTraca(mouvementsTraca: Array<MouvementTraca>, prisesToFinish: Array<number> = []): Observable<any> {
        return Observable
            .zip(
                ...mouvementsTraca
                    .map((mouvement) => ({
                        id: null,
                        ...mouvement,
                        date: mouvement.date + '_' + Math.random().toString(36).substr(2, 9)
                    }))
                    .map((mouvement) => this.sqliteProvider.insert('`mouvement_traca`', mouvement)),
                this.sqliteProvider.finishPrises(prisesToFinish)
            )
            .pipe(map(() => undefined))
    }

    /**
     * Send all "preparations", "livraisons" or "collectes", "inventory" finished in local database to the api
     * @return false if no request has been done, or api response
     */
    public sendFinishedProcess(process: Process): Observable<{success: any, error: any}|false> {
        const apiProccessConfig = this.apiProccessConfigs[process];
        return apiProccessConfig.createApiParams()
            .pipe(
                flatMap(({paramName, ...params}) => {
                    let res$;
                    if (params[paramName] && params[paramName].length > 0) {
                        res$ = new Subject();
                        this.apiService
                            .requestApi('post', apiProccessConfig.service, {params})
                            .pipe(flatMap((res) => {
                                const {success, errors, data} = res;
                                if (apiProccessConfig.titleErrorAlert
                                    && apiProccessConfig.numeroProccessFailed
                                    && errors
                                    && errors.length > 0) {
                                    this.presentAlertError(
                                        apiProccessConfig.titleErrorAlert,
                                        apiProccessConfig.numeroProccessFailed,
                                        errors
                                    );
                                }
                                return of(undefined)
                                    .pipe(
                                        flatMap(() => apiProccessConfig.deleteSucceed(success)),
                                        flatMap(() => apiProccessConfig.resetFailed
                                            ? apiProccessConfig.resetFailed(errors)
                                            : of(undefined)),
                                        flatMap(() => apiProccessConfig.treatData && data
                                            ? apiProccessConfig.treatData(data)
                                            : of(undefined)),
                                    )
                                    .pipe(map(() => res));
                            }))
                            .subscribe(
                                (res) => {
                                    res$.next(res);
                                },
                                (err) => {
                                    res$.error({...err, api: true})
                                }
                            )
                    }
                    else {
                        res$ = of(false);
                    }

                    return res$;
                })
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
                    cssClass: 'alert-success'
                }]
            })
            .present()
            .then(() => {
                this.alertManager.breakMessageLines();
            });
    }
}
