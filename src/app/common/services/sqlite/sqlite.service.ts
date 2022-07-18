import {Injectable} from '@angular/core';
import {StorageService} from '@app/common/services/storage/storage.service';
import {Livraison} from '@entities/livraison';
import {from, Observable, of, ReplaySubject, Subject, zip} from 'rxjs';
import {flatMap, map, mergeMap, take, tap} from 'rxjs/operators';
import {Handling} from '@entities/handling';
import {MouvementTraca} from '@entities/mouvement-traca';
import {Anomalie} from "@entities/anomalie";
import {ArticlePrepaByRefArticle} from "@entities/article-prepa-by-ref-article";
import {ArticleCollecte} from "@entities/article-collecte";
import {ArticleLivraison} from "@entities/article-livraison";
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Platform} from '@ionic/angular';
import * as moment from 'moment';
import {TablesDefinitions} from '@app/common/services/sqlite/tables-definitions';
import {TableName} from '@app/common/services/sqlite/table-definition';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';


@Injectable({
    providedIn: 'root'
})
export class SqliteService {

    private static readonly DB_NAME: string = 'follow_gt';

    private sqliteObject$: Subject<SQLiteObject>;

    public constructor(private sqlite: SQLite,
                       private storageService: StorageService,
                       private platform: Platform) {
        this.sqliteObject$ = new ReplaySubject<SQLiteObject>(1);
        this.createDB();
    }

    public static ExecuteQueryStatic(db: SQLiteObject, query: string, getRes: boolean = true, params: Array<any> = []) {
        return from(db.executeSql(query, params)).pipe(map((res) => (getRes ? res : undefined)));
    }

    private get db$(): Observable<SQLiteObject> {
        return this.sqliteObject$.pipe(take(1));
    }

    private createDB(): void {
        // We wait sqlite plugin loading and we create the database
        from(this.platform.ready())
            .pipe(
                flatMap(() => this.sqlite.create({name: SqliteService.DB_NAME, location: 'default'})),
                flatMap((sqliteObject: SQLiteObject) => SqliteService.ResetDataBase(sqliteObject).pipe(map(() => sqliteObject)))
            )
            .subscribe(
                (sqliteObject: SQLiteObject) => {
                    this.sqliteObject$.next(sqliteObject);
                },
                e => console.log(e)
            );
    }

    private static ExecuteQueryFlatMap(db: SQLiteObject, queries: Array<string>): Observable<void> {
        const [firstQuery, ...remainingQueries] = queries;
        return firstQuery
            ? SqliteService.ExecuteQueryStatic(db, firstQuery).pipe(flatMap(() => SqliteService.ExecuteQueryFlatMap(db, remainingQueries)))
            : of(undefined);
    }

    private static CreateTables(db: SQLiteObject): Observable<any> {
        const createDatabaseRequests = TablesDefinitions.map(({name, attributes}) => {
            const attributesStr = Object
                .keys(attributes)
                .map((attr) => (`\`${attr}\` ${attributes[attr]}`))
                .join(', ');
            return `CREATE TABLE IF NOT EXISTS \`${name}\` (${attributesStr})`;
        });
        return SqliteService.ExecuteQueryFlatMap(db, createDatabaseRequests);
    }

    public static ResetDataBase(sqliteObject: SQLiteObject, force: boolean = false): Observable<any> {
        return SqliteService.DropTables(sqliteObject, force)
            .pipe(
                flatMap(() => SqliteService.CreateTables(sqliteObject)),
                map(() => undefined),
                take(1)
            );
    }

    private static MultiSelectQueryMapper<T = any>(resQuery): Array<T> {
        const list = [];
        if (resQuery && resQuery.rows) {
            for (let i = 0; i < resQuery.rows.length; i++) {
                list.push(resQuery.rows.item(i));
            }
        }
        return list;
    }

    private static DropTables(db: SQLiteObject, force: boolean): Observable<any> {
        const dropDatabaseRequests = TablesDefinitions
            .filter(({keepOnConnection}) => force || !keepOnConnection)
            .map(({name}) => `DROP TABLE IF EXISTS \`${name}\`;`);
        return SqliteService.ExecuteQueryFlatMap(db, dropDatabaseRequests);
    }

    private static JoinWhereClauses(where: Array<string>): string {
        const whereJoined = where
            .map((clause) => `(${clause})`)
            .join(' AND ');
        return `(${whereJoined})`;
    }

    public resetDataBase(force: boolean = false): Observable<any> {
        return this.db$.pipe(flatMap((db) => SqliteService.ResetDataBase(db, force)));
    }

    private importLocations(data): Observable<any> {
        let apiEmplacements = data['locations'];
        const filled = (apiEmplacements && apiEmplacements.length > 0);

        return filled
            ? this
                .deleteBy('emplacement')
                .pipe(flatMap(() => this.insert('emplacement', apiEmplacements)))
            : of(undefined);
    }

    private importDispatchesData(data): Observable<any> {
        const dispatches = data['dispatches'] || [];
        const dispatchPacks = data['dispatchPacks'] || [];

        return zip(
            this.deleteBy('dispatch'),
            this.deleteBy('dispatch_pack')
        )
            .pipe(
                flatMap(() => (
                    dispatches.length > 0
                        ? this.insert('dispatch', dispatches)
                        : of(undefined)
                )),
                flatMap(() => (
                    dispatchPacks.length > 0
                        ? this.insert('dispatch_pack', dispatchPacks)
                        : of(undefined)
                ))
            );
    }

    public importPreparations(data, deleteOld: boolean = true): Observable<any> {
        const preparations = (data['preparations'] || []);
        const articlesPrepaApi = (data['articlesPrepa'] || []);
        const preparationIds = preparations.map(({id}) => id);

        return of(undefined).pipe(
            mergeMap(() => deleteOld ? this.deleteBy('preparation') : of(undefined)),
            mergeMap(() => this.insert(
                'preparation',
                preparations.map(({number, ...preparation}) => ({started: 0, numero: number, ...preparation}))
            )),

            // articlePrepa
            mergeMap(() => (
                preparationIds.length > 0
                    ? this.findBy('article_prepa', [`id_prepa IN (${preparationIds.join(',')})`, `deleted <> 1`])
                        .pipe(
                            mergeMap((articles) => {
                                const articlesToInsert = articlesPrepaApi
                                    .filter((toInsert) => (
                                        articles.every((articlePrepa) => (
                                            (articlePrepa.id_prepa !== toInsert.id_prepa) ||
                                            (articlePrepa.reference !== toInsert.reference)
                                        ))
                                    ))
                                    .map((toInsert) => ({
                                        label: toInsert.label,
                                        reference: toInsert.reference,
                                        quantite: toInsert.quantity,
                                        is_ref: toInsert.is_ref,
                                        id_prepa: toInsert.id_prepa,
                                        has_moved: 0,
                                        emplacement: toInsert.location,
                                        type_quantite: toInsert.type_quantite,
                                        barcode: toInsert.barCode,
                                        original_quantity: toInsert.quantity,
                                        reference_article_reference: toInsert.reference_article_reference,
                                        targetLocationPicking: toInsert.targetLocationPicking,
                                    }))
                                ;

                                return this.insert('article_prepa', articlesToInsert);
                            }))
                    : of(undefined)
            ))
        );
    }

    public importHandlings(data): Observable<any> {
        let handlings = data['handlings'];
        let handlingAttachments = data['handlingAttachments'];

        return zip(
            this.deleteBy('handling'),
            this.deleteBy('handling_attachment')
        )
            .pipe(
                flatMap(() => this.findAll('handling')),
                flatMap((alreadyInserted: Array<Handling>) => {
                    const alreadyInsertedIds = alreadyInserted.map(({id}) => Number(id));
                    const handlingsToInsert = handlings.filter(({id}) => (alreadyInsertedIds.indexOf(Number(id)) === -1));
                    const handlingsToUpdate = handlings.filter(({id}) => (alreadyInsertedIds.indexOf(Number(id)) > -1));
                    return handlingsToInsert.length > 0 || handlingsToUpdate.length > 0
                        ? zip(
                            handlingAttachments.length > 0
                                ? this.insert('handling_attachment', handlingAttachments)
                                : of(undefined),
                            handlingsToInsert.length > 0
                                ? this.insert('handling', handlingsToInsert)
                                : of(undefined),
                            handlingsToUpdate.length > 0
                                ? this.update(
                                    'handling',
                                    handlingsToUpdate.map(({id, ...handling}) => ({values: handling, where: [`where id = ${id}`]}))
                                )
                                : of(undefined)
                        )
                        : of(undefined);
                }),
                map(() => undefined)
            );
    }

    public importTransferOrderData(data): Observable<any> {
        const transferOrders = data['transferOrders'];
        const transferOrderArticles = data['transferOrderArticles'];

        return zip(
            this.deleteBy('transfer_order'),
            this.deleteBy('transfer_order_article')
        )
            .pipe(
                flatMap(() => (
                    transferOrders && transferOrders.length > 0
                        ? this.insert('transfer_order', transferOrders.map((transferOrder) => ({treated: 0, ...transferOrder})))
                        : of(undefined)
                )),
                flatMap(() => (
                    transferOrderArticles && transferOrderArticles.length > 0
                        ? this.insert('transfer_order_article', transferOrderArticles)
                        : of(undefined)
                )),
                map(() => undefined)
            );
    }

    public importTransportRoundData(data): Observable<any> {
        const transportRounds = data['transportRounds'];
        const transportRoundLines = data['transportRoundLines'];

        return zip(
            this.deleteBy('transport_round'),
            this.deleteBy('transport_round_line')
        )
            .pipe(
                flatMap(() => (
                    transportRounds && transportRounds.length > 0
                        ? this.insert('transport_round', transportRounds)
                        : of(undefined)
                )),
                flatMap(() => (
                    transportRoundLines && transportRoundLines.length > 0
                        ? this.insert('transport_round_line', transportRoundLines)
                        : of(undefined)
                )),
                map(() => undefined)
            );
    }

    public importMouvementTraca(data): Observable<any> {
        const apiTaking = [
            ...(data['trackingTaking'] || []),
            ...(data['stockTaking'] || [])
        ];

        return (apiTaking && apiTaking.length > 0)
            ? this.findBy('mouvement_traca', ['finished <> 1', `type LIKE 'prise'`])
                  .pipe(flatMap((prises: Array<MouvementTraca>) => (
                      apiTaking.length > 0
                          ? zip(
                              ...apiTaking.map((apiPicking) => (
                                  !prises.some(({date}) => (date === apiPicking.date))
                                      ? this.insert('mouvement_traca', {
                                          ...apiPicking,
                                          isGroup: (apiPicking.isGroup || false),
                                          subPacks: (apiPicking.subPacks || [])
                                      })
                                      : this.update(
                                          'mouvement_traca',
                                          [{
                                              values: {subPacks: (apiPicking.subPacks || [])},
                                              where: [`ref_article = '${apiPicking.ref_article}'`]
                                          }]
                                      )
                              ))
                          )
                          : of(undefined)
                  )))
            : of(undefined);
    }

    public importDemandesLivraisonData(data): Observable<void> {
        const demandeLivraisonArticles = data['demandeLivraisonArticles'] || [];
        const demandeLivraisonTypes = data['demandeLivraisonTypes'] || [];
        // On supprimer tous les types
        return zip(
            this.findAll('article_in_demande_livraison'),
            this.findAll('demande_livraison')
        )
            .pipe(
                // On garde les types qui sont dans des demandes en brouillon
                //  --> on supprime les types qui sont dans la liste du getDataArray ET ceux qui ne sont pas dans des demandes en brouillon
                // On garde les articles qui sont dans des demandes en brouillon
                //  --> on supprime les articles qui sont dans la liste du getDataArray ET ceux qui ne sont pas dans des demandes en brouillon
                flatMap(([articleBarCodesInDemande, demandeLivraisonInDB]: [Array<{bar_code: string}>, Array<{type_id: number}>]) => {
                    const demandeLivraisonArticlesBarCodesToImport = demandeLivraisonArticles.map(({bar_code}) => `'${bar_code}'`);
                    const articleBarCodesInDemandeBarCodes = articleBarCodesInDemande.map(({bar_code}) => `'${bar_code}'`);

                    const demandeLivraisonTypesIdsToImport = demandeLivraisonTypes.map(({id}) => id); // les ids des types à importer
                    const typeIdsInDemandes = demandeLivraisonInDB.reduce((acc, {type_id}) => {
                        if (acc.indexOf(type_id) === -1) {
                            acc.push(type_id);
                        }
                        return acc;
                    }, []); // les ids des types dans les demandes

                    return zip(
                        (demandeLivraisonTypesIdsToImport.length > 0 || typeIdsInDemandes.length > 0)
                            ? this.deleteBy('demande_livraison_type', [
                                [
                                    demandeLivraisonTypesIdsToImport.length > 0 ? `(id IN (${demandeLivraisonTypesIdsToImport.join(',')}))` : '',
                                    typeIdsInDemandes.length > 0 ? `(id NOT IN (${typeIdsInDemandes.join(',')}))` : ''
                                ]
                                    .filter(Boolean)
                                    .join(' OR ')
                            ])
                            : of(undefined),
                        (demandeLivraisonArticlesBarCodesToImport.length > 0 || articleBarCodesInDemandeBarCodes.length > 0)
                            ? this.deleteBy('demande_livraison_article', [
                                [
                                    demandeLivraisonArticlesBarCodesToImport.length > 0 ? `(bar_code IN (${demandeLivraisonArticlesBarCodesToImport.join(',')}))` : '',
                                    articleBarCodesInDemandeBarCodes.length > 0 ? `(bar_code NOT IN (${articleBarCodesInDemandeBarCodes.join(',')}))` : ''
                                ]
                                    .filter(Boolean)
                                    .join(' OR ')
                            ])
                            : of(undefined)
                    );
                }),
                flatMap(() => zip(
                    this.update('demande_livraison_article', [{values: {to_delete: true}}]),
                    this.update('demande_livraison_type', [{values: {to_delete: true}}])
                )),
                flatMap(() => (
                    ((demandeLivraisonArticles && demandeLivraisonArticles.length > 0) || (demandeLivraisonTypes && demandeLivraisonTypes.length > 0))
                    ? zip(
                        this.insert('demande_livraison_article', demandeLivraisonArticles || []),
                        this.insert('demande_livraison_type', demandeLivraisonTypes || []),
                    )
                    : of(undefined)
                ))
            );
    }

    public importNaturesData(data, clearAll: boolean = true): Observable<void> {
        const natures = data['natures'] || [];

        if (clearAll) {
            return this.deleteBy('nature')
                .pipe(
                    flatMap(() => this.insert('nature', natures)),
                    map(() => undefined)
                );
        } else {
            const naturesInsert = natures.map(({id, ...remainingNature}) => {
                return flatMap(() => (
                    this.deleteBy('nature', [`id = ${id}`])
                        .pipe(
                            flatMap(() => this.insert('nature', {id, ...remainingNature}))
                        )
                ))
            });
            if (naturesInsert.length === 0) {
                naturesInsert.push(map(() => undefined));
            }
            return zip(
                // @ts-ignore
                of(undefined).pipe(...naturesInsert)
            )
                .pipe(map(() => undefined));
        }
    }

    public importAllowedNaturesData(data): Observable<void> {
        const allowedNatureInLocations = data['allowedNatureInLocations'] || [];
        return this.deleteBy('allowed_nature_location').pipe(
            flatMap(() => (
                allowedNatureInLocations.length > 0
                    ? this.insert('allowed_nature_location', allowedNatureInLocations)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importStatusData(data): Observable<void> {
        const status = data['status'] || [];
        return this.deleteBy('status').pipe(
            flatMap(() => (
                status.length > 0
                    ? this.insert('status', status)
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    public importFreeFieldsData(data): Observable<void> {
        // for multiple types
        const freeFields = data['freeFields'] || [];

        return of(undefined).pipe(
            flatMap(() => this.deleteBy('free_field')),
            flatMap(() => (
                (freeFields.length > 0)
                    ? this.insert('free_field', freeFields)
                    : of(undefined)
            ))
        );

    }

    public importLivraisons(data): Observable<any> {
        const apiDeliveryOrder: Array<Livraison> = data['livraisons'];
        const apiDeliveryOrderArticle: Array<ArticleLivraison> = data['articlesLivraison'];

        const ordersToInsert = apiDeliveryOrder
            ? apiDeliveryOrder.map(({id}) => id)
            : [];

        return zip(
            this.deleteBy('livraison'),
            this.findAll('article_livraison')
        )
            .pipe(
                flatMap(([_, existingDeliveryOrderArticle]: [any, Array<ArticleLivraison>]) => {
                    // if article already exists we do not inset it
                    const deliveryOrderArticlesToInsert = apiDeliveryOrderArticle.filter((toInsert) => (
                        !existingDeliveryOrderArticle.some((existing) => (
                            (Number(existing.is_ref) === Number(toInsert.is_ref))
                            && (Number(existing.id_livraison) === Number(toInsert.id_livraison))
                            && (existing.reference === toInsert.reference)
                        ))
                    ));

                    return zip(
                        // orders insert
                        apiDeliveryOrder && apiDeliveryOrder.length > 0
                            ? this.insert('livraison', apiDeliveryOrder)
                            : of(undefined),

                        // articles insert
                        deliveryOrderArticlesToInsert && deliveryOrderArticlesToInsert.length > 0
                            ? this.insert('article_livraison', deliveryOrderArticlesToInsert.map((article) => ({has_moved: 0, ...article})))
                            : of(undefined)
                    );
                }),
                // remove unused articles
                flatMap(() => (
                    ordersToInsert.length > 0
                        ? this.deleteBy('article_livraison', [`id_livraison NOT IN (${ordersToInsert.join(',')})`])
                        : of(undefined)
                ))
            );
    }

    /**
     * Import in sqlite api data from collectes and articlesCollecte fields
     * @param data
     */
    public importCollectes(data): Observable<any> {
        const collectesAPI = data['collectes'];
        const articlesCollecteAPI = data['articlesCollecte'];

        return of(undefined).pipe(
            flatMap(() => this.deleteBy('collecte')),
            flatMap(() => this.deleteBy('article_collecte')),

            flatMap(() => (
                collectesAPI.length > 0
                    ? this.insert('collecte', collectesAPI
                        .map(({id, number, location_from, forStock, requester, type, comment}) => ({
                            id,
                            number,
                            location_from,
                            forStock,
                            requester,
                            type,
                            comment
                        })))
                    : of(undefined)
            )),
            flatMap(() => (
                (articlesCollecteAPI && articlesCollecteAPI.length > 0)
                    ? this.insert('article_collecte', articlesCollecteAPI.map(({label, quantity_type, reference, quantity, is_ref, id_collecte, location, barCode, reference_label}) => ({
                        label,
                        reference,
                        is_ref,
                        id_collecte,
                        quantity_type,
                        emplacement: location,
                        barcode: barCode,
                        reference_label,
                        quantite: quantity,
                        has_moved: 0,
                    })))
                    : of(undefined)
            )),
            map(() => undefined)
        );
    }

    /**
     * Send sql values for insert the article_collecte
     */
    public getArticleCollecteValueFromApi(articleCollecte): string {
        return (
            "(NULL, " +
            "'" + this.escapeQuotes(articleCollecte.label) + "', " +
            "'" + this.escapeQuotes(articleCollecte.reference) + "', " +
            articleCollecte.quantity + ", " +
            articleCollecte.is_ref + ", " +
            articleCollecte.id_collecte + ", " +
            "0, " +
            "'" + this.escapeQuotes(articleCollecte.location) + "', " +
            "'" + articleCollecte.barCode + "', " +
            "'" + articleCollecte.reference_label + "')"
        );
    }

    /**
     * Create Sql query to insert given sqlValues
     */
    public getArticleCollecteInsertQuery(articlesCollecteValues: Array<string>): string {
        return (
            'INSERT INTO `article_collecte` (' +
                '`id`, ' +
                '`label`, ' +
                '`reference`, ' +
                '`quantite`, ' +
                '`is_ref`, ' +
                '`id_collecte`, ' +
                '`has_moved`, ' +
                '`emplacement`, ' +
                '`barcode`, ' +
                '`reference_label`' +
            ') ' +
            'VALUES ' + articlesCollecteValues.join(',') + ';'
        );
    }

    public findArticlesByCollecte(id_col: number): Observable<Array<ArticleCollecte>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `article_collecte` WHERE `id_collecte` = ' + id_col, []))),
            map((articles) => SqliteService.MultiSelectQueryMapper<ArticleCollecte>(articles))
        );
    }

    public importArticlesInventaire(data): Observable<any> {
        let articlesInventaire = data['inventoryMission'];
        return this.deleteBy('article_inventaire')
            .pipe(
                flatMap(() => (
                    (articlesInventaire && articlesInventaire.length > 0)
                        ? this.insert('article_inventaire', articlesInventaire.map(({
                                                                                        mission_id,
                                                                                        reference,
                                                                                        is_ref,
                                                                                        location,
                                                                                        barCode,
                                                                                        mission_start,
                                                                                        mission_end,
                                                                                        mission_name,}) => ({
                            mission_id,
                            mission_start,
                            mission_end,
                            mission_name,
                            reference,
                            is_ref,
                            location: location ? location : 'N/A',
                            barcode: barCode
                        })))
                        : of(undefined)
                ))
            );
    }

    public importArticlesPrepaByRefArticle(data, partial: boolean = false): Observable<any> {
        const articlesPrepaByRefArticle: Array<ArticlePrepaByRefArticle> = data['articlesPrepaByRefArticle'];
        return of(undefined)
            .pipe(
                flatMap(() => (
                    partial
                        ? this.findAll('article_prepa_by_ref_article')
                        : this.deleteBy('article_prepa_by_ref_article').pipe(map(() => ([])))
                )),
                flatMap((articlesInDatabase: Array<ArticlePrepaByRefArticle>) => {
                    // On supprimer les refArticleByRefarticle dont le champ reference_article est renvoyé par l'api
                    const refArticleToDelete = (articlesInDatabase.length > 0 ? (articlesPrepaByRefArticle || []) : [])
                        .reduce((acc, {reference_article}) => {
                            if (acc.indexOf(reference_article) === -1) {
                                acc.push(reference_article);
                            }
                            return acc;
                        }, [])
                        .map((reference) => `'${reference}'`);
                    return refArticleToDelete.length > 0
                        ? this.deleteBy('article_prepa_by_ref_article', [`reference_article IN (${refArticleToDelete})`])
                        : of(undefined)
                }),
                flatMap(() => (
                    (articlesPrepaByRefArticle && articlesPrepaByRefArticle.length > 0)
                        ? this.insert('article_prepa_by_ref_article', articlesPrepaByRefArticle.map((article) => ({
                            ...article,
                            isSelectableByUser: 1
                        })))
                        :  of(undefined)
                ))
            );
    }

    public importAnomaliesInventaire(data, deleteOldAnomalies: boolean = true): Observable<any> {
        let ret$: ReplaySubject<any> = new ReplaySubject(1);
        let anomalies = data.anomalies;

        (deleteOldAnomalies
            ? this.deleteBy('anomalie_inventaire').pipe(map(() => ([])))
            : this.findAll('anomalie_inventaire'))
                .subscribe((oldAnomalies: Array<Anomalie>) => {
                    const anomaliesToInsert = anomalies
                        // we check if anomalies are not already in local database
                        .filter(({id}) => oldAnomalies.every(({id: oldAnomaliesId}) => (Number(id) !== Number(oldAnomaliesId))))
                        .map((anomaly) => (
                            "(" +
                            anomaly.id + ", " +
                            "'" + this.escapeQuotes(anomaly.reference) + "', " +
                            anomaly.is_ref + ", " +
                            "'" + anomaly.quantity + "', " +
                            "'" + anomaly.countedQuantity + "', " +
                            "'" + this.escapeQuotes(anomaly.location ? anomaly.location : 'N/A') + "', " +
                            anomaly.isTreatable + ", " +
                            "'" + anomaly.barCode + "', " +
                            anomaly.mission_id + ")"
                        ));
                    if (anomaliesToInsert.length === 0) {
                        ret$.next(undefined);
                    }
                    else {
                        const anomaliesValuesStr = anomaliesToInsert.join(', ');
                        let sqlAnomaliesInventaire = 'INSERT INTO `anomalie_inventaire` (`id`, `reference`, `is_ref`, `quantity`, `countedQuantity`, `location`, `is_treatable`, `barcode`, `mission_id`) VALUES ' + anomaliesValuesStr + ';';
                        this.executeQuery(sqlAnomaliesInventaire).subscribe(() => {
                            ret$.next(true);
                        });
                    }
                });
        return ret$;
    }

    private importTranslations(data): Observable<any> {
        const translations = data.translations;

        return this.deleteBy('translations')
            .pipe(
                flatMap(() => (
                    translations.length === 0
                        ? of(undefined)
                        : this.insert('translations', translations.map(({menu, label, translation}) => ({menu, label, translation})))
                            .pipe(map(() => true))
                ))
            );
    }

    public importData(data: any): Observable<any> {
        return of(undefined).pipe(
            flatMap(() => this.importLocations(data).pipe(tap(() => {console.log('--- > importLocations')}))),
            flatMap(() => this.importArticlesPrepaByRefArticle(data).pipe(tap(() => {console.log('--- > importArticlesPrepaByRefArticle')}))),
            flatMap(() => this.importPreparations(data).pipe(tap(() => {console.log('--- > importPreparations')}))),
            flatMap(() => this.importLivraisons(data).pipe(tap(() => {console.log('--- > importLivraisons')}))),
            flatMap(() => this.importArticlesInventaire(data).pipe(tap(() => {console.log('--- > importArticlesInventaire')}))),
            flatMap(() => this.importHandlings(data).pipe(tap(() => {console.log('--- > importHandlings')}))),
            flatMap(() => this.importCollectes(data).pipe(tap(() => {console.log('--- > importCollectes')}))),
            flatMap(() => this.importMouvementTraca(data).pipe(tap(() => {console.log('--- > importMouvementTraca')}))),
            flatMap(() => this.importDemandesLivraisonData(data).pipe(tap(() => {console.log('--- > importDemandeLivraisonData')}))),
            flatMap(() => this.importNaturesData(data).pipe(tap(() => {console.log('--- > importNaturesData')}))),
            flatMap(() => this.importAllowedNaturesData(data).pipe(tap(() => {console.log('--- > importAllowedNaturesData')}))),
            flatMap(() => this.importFreeFieldsData(data).pipe(tap(() => {console.log('--- > importFreeFieldData')}))),
            flatMap(() => this.importTranslations(data).pipe(tap(() => {console.log('--- > importTranslations')}))),
            flatMap(() => this.importDispatchesData(data).pipe(tap(() => {console.log('--- > importDispatchesData')}))),
            flatMap(() => this.importStatusData(data).pipe(tap(() => {console.log('--- > importStatusData')}))),
            flatMap(() => this.importTransferOrderData(data).pipe(tap(() => {console.log('--- > importTransferOrderData')}))),
            flatMap(() => this.importTransportRoundData(data).pipe(tap(() => {console.log('--- > importTransportRoundData')}))),
            flatMap(() => (
                this.storageService.getRight(StorageKeyEnum.RIGHT_INVENTORY_MANAGER).pipe(
                    flatMap((res) => (res
                        ? this.importAnomaliesInventaire(data)
                        : of(undefined))),
                )
            ))
        );
    }

    public findOneById(table: TableName, id: number): Observable<any> {
        return this.findOneBy(table, {id});
    }

    public findOneBy(table: TableName, conditions: {[name: string]: any}, glue: string = 'OR'): Observable<any> {
        const condition = Object
            .keys(conditions)
            .map((name) => `${name} ${this.getComparatorForQuery(conditions[name])} ${this.getValueForQuery(conditions[name])}`)
            .join(` ${glue} `);

        return this.db$.pipe(
            flatMap((db) => from(db.executeSql(`SELECT * FROM ${table} WHERE ${condition}`, []))),
            map((data) => (
                (data.rows.length > 0)
                    ? data.rows.item(0)
                    : null
            ))
        );
    }

    public count(table: TableName, where: string[] = []): Observable<number> {
        let whereClause = (where && where.length > 0)
            ? ` WHERE ${where.map((condition) => `(${condition})`).join(' AND ')}`
            : '';

        let query = `SELECT COUNT(*) AS nb FROM ${table}${whereClause}`;

        return this.executeQuery(query)
            .pipe(
                map((data) => {
                    let count = 0;
                    if (data.rows.length > 0) {
                        let item = data.rows.item(0);
                        count = item.nb;
                    }
                    return Number(count);
                })
            );
    }

    public findArticlesInDemandeLivraison(demandeId: number) {
        const query = (
            `SELECT demande_livraison_article.*, article_in_demande_livraison.quantity_to_pick AS quantity_to_pick ` +
            `FROM demande_livraison_article ` +
            `INNER JOIN article_in_demande_livraison ON article_in_demande_livraison.article_bar_code = demande_livraison_article.bar_code ` +
            `WHERE article_in_demande_livraison.demande_id = ${demandeId}`
        );
        return this.executeQuery(query).pipe(
            map((data) => SqliteService.MultiSelectQueryMapper<any>(data)),
            take(1)
        );
    }

    public findArticlesNotInDemandeLivraison(): Observable<Array<DemandeLivraisonArticle>> {
        const query = (
            `SELECT demande_livraison_article.*
            FROM demande_livraison_article
            LEFT JOIN article_in_demande_livraison ON article_in_demande_livraison.article_bar_code = demande_livraison_article.bar_code
            WHERE article_in_demande_livraison.demande_id IS NULL`
        );
        return this.executeQuery(query).pipe(
            map((data) => SqliteService.MultiSelectQueryMapper<any>(data)),
        );
    }

    public countArticlesByDemandeLivraison(demandeIds: Array<number>): Observable<{ [demande_id: number]: number }> {
        const demandeIdsJoined = demandeIds.join(',');
        const query = (
            `SELECT COUNT(article_in_demande_livraison.article_bar_code) AS counter, article_in_demande_livraison.demande_id AS demande_id ` +
            `FROM article_in_demande_livraison ` +
            `WHERE article_in_demande_livraison.demande_id IN (${demandeIdsJoined}) ` +
            `GROUP BY article_in_demande_livraison.demande_id`
        );
        return this.executeQuery(query).pipe(
            map((data) => SqliteService.MultiSelectQueryMapper<any>(data)),
            map((counters: Array<{demande_id: number, counter: number}>) => (
                counters.reduce((acc, {demande_id, counter}) => ({
                    ...acc,
                    [Number(demande_id)]: Number(counter)
                }), {})
            )),
            take(1)
        );
    }

    /**
     * find all elements in the given table which correspond to the given where clauses.
     * @param {string} table name of the table to do the search
     * @param {string[]} where boolean clauses to apply with AND separator
     * @param {Object.<string,'ASC'|'DESC'>} order
     * @param {number|undefined} limit
     * @param {number|undefined} offset
     */
    public findBy(table: TableName, where: Array<string> = [], order: {[column: string]: 'ASC'|'DESC'} = {}, {limit, offset}: { limit?: number, offset?: number } = {}): Observable<any> {
        const sqlWhereClauses = (where && where.length > 0)
            ? ` WHERE ${SqliteService.JoinWhereClauses(where)}`
            : undefined;

        const orderByArray = Object
            .keys(order || {})
            .map((column: string) => `${column} ${order[column]}`)

        const sqlOrderByClauses = (orderByArray && orderByArray.length > 0)
            ? ` ORDER BY ${orderByArray.join(',')}`
            : undefined;

        const offsetClause = offset ? ` OFFSET ${offset}` : '';
        const limitClause = limit ? ` LIMIT ${limit}${offsetClause}` : undefined;

        const sqlQuery = `SELECT * FROM ${table}${sqlWhereClauses || ''}${sqlOrderByClauses || ''}${limitClause || ''}`;
        return this.executeQuery(sqlQuery).pipe(
            map((data) => SqliteService.MultiSelectQueryMapper<any>(data)),
            take(1)
        );
    }

    public findAll(table: TableName): Observable<any> {
        return this.findBy(table)
    }

    private createInsertQuery(name: TableName, objects: any|Array<any>): string {
        const isMultiple = Array.isArray(objects);
        const objectKeys = Object.keys(isMultiple ? objects[0] : objects);

        if (!isMultiple) {
            objects = [objects];
        }
        const valuesMap = objects.map((values) => (
            '('
            + objectKeys.map((key) => this.getValueForQuery(values[key])).join((', '))
            + ')'
        ));
        return "INSERT INTO " + name +
            ' (' + objectKeys.join(', ') + ') ' +
            "VALUES " +
            valuesMap.join(', ');
    }

    private createUpdateQuery(name: TableName, values: any, where: Array<string>): string {
        const objectKeys = Object.keys(values);
        const whereClauses = SqliteService.JoinWhereClauses(where);
        const valuesMapped = objectKeys.map((key) => `${key} = ${this.getValueForQuery(values[key])}`);

        return valuesMapped.length > 0
            ? `
                UPDATE ${name}
                SET ${valuesMapped.join(', ')}
                ${where.length > 0 ? 'WHERE ' + whereClauses : ''}
            `
            : undefined;
    }

    public insert(name: TableName, objects: any|Array<any>): Observable<number> {
        if (objects
            && (
                !Array.isArray(objects)
                || objects.length > 0
            )) {
            let query = this.createInsertQuery(name, objects);
            return this.executeQuery(query).pipe(map(({insertId}) => insertId));
        }
        else {
            return of(undefined);
        }
    }

    public update(name: TableName, config: Array<{values: any, where?: Array<string>}>): Observable<any> {
        const queries = config.map(({values, where}) => this.createUpdateQuery(name, values, where || []));
        return queries.length > 0
            ? this.executeQuery(queries)
            : of(false);
    }

    public executeQuery(queries: string|Array<string>, getRes: boolean = true, params: Array<any> = []): Observable<any> {
        const queriesStr = typeof queries === 'string'
            ? queries
            : queries.join(';')
        return this.db$.pipe(
            flatMap((db) => SqliteService.ExecuteQueryStatic(db, queriesStr, getRes, params)),
            tap(
                () => {},
                (error) => {
                    console.error(queries, error);
                }
            ),
            map((res) => (getRes ? res : undefined))
        );
    }

    public findMvtByArticlePrepa(id_art: number): Observable<any> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `mouvement` WHERE `id_article_prepa` = ' + id_art + ' LIMIT 1', []))),
            map((mvt) => (
                (mvt && mvt.rows && mvt.rows.length > 0 && mvt.rows.item(0).url !== '')
                    ? mvt.rows.item(0)
                    : null
            ))
        );
    }

    public findMvtByArticleLivraison(id_art: number): Observable<any> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `mouvement` WHERE `id_article_livraison` = ' + id_art + ' LIMIT 1', []))),
            map((mvt) => (
                (mvt && mvt.rows && mvt.rows.length > 0 && mvt.rows.item(0).url !== '')
                    ? mvt.rows.item(0)
                    : null
            ))
        );
    }

    public findMvtByArticleCollecte(id_art: number): Observable<any> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `mouvement` WHERE `id_article_collecte` = ' + id_art + ' LIMIT 1', []))),
            map((mvt) => (
                (mvt && mvt.rows && mvt.rows.length > 0 && mvt.rows.item(0).url !== '')
                    ? mvt.rows.item(0)
                    : null
            ))
        );
    }

    public finishPrepa(id_prepa: number, emplacement): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `preparation` SET date_end = \'' + moment().format() + '\', emplacement = \'' + emplacement + '\' WHERE id = ' + id_prepa, []))),
            map(() => undefined)
        );
    }

    public resetFinishedPrepas(id_prepas: Array<number>): Observable<undefined> {
        const idPrepasJoined = id_prepas.join(',');
        return this.executeQuery(`UPDATE \`preparation\` SET date_end = NULL, emplacement = NULL WHERE id IN (${idPrepasJoined})`, false);
    }

    public resetFinishedCollectes(id_collectes: Array<number>): Observable<any> {
        const idCollectesJoined = id_collectes.join(',');
        return zip(
            this.executeQuery(`UPDATE \`collecte\` SET date_end = NULL, location_to = NULL WHERE id IN (${idCollectesJoined})`, false),
            this.executeQuery(`UPDATE \`article_collecte\` SET has_moved = 0 WHERE id_collecte IN (${idCollectesJoined})`, false)
        );
    }

    public startPrepa(id_prepa: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `preparation` SET started = 1 WHERE id = ' + id_prepa, []))),
            map(() => undefined)
        );
    }

    public finishCollecte(id_collecte: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql("UPDATE `collecte` SET date_end = '" + moment().format() + '\' WHERE id = ' + id_collecte, []))),
            map(() => undefined)
        );
    }

    public finishMvt(id_mvt: number, location_to?: string): Observable<undefined> {
        const setLocationQuery = location_to
            ? `, location = '${location_to}'`
            : '';
        return this.executeQuery(`UPDATE \`mouvement\` SET date_drop = '${moment().format()}'${setLocationQuery} WHERE id = ${id_mvt}`, false);
    }

    public moveArticle(id_article: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_prepa` SET has_moved = 1 WHERE id = ' + id_article, []))),
            map(() => undefined)
        );
    }

    public moveArticleLivraison(id_article: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_livraison` SET has_moved = 1 WHERE id = ' + id_article, []))),
            map(() => undefined)
        );
    }

    public moveArticleCollecte(id_article_collecte: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_collecte` SET has_moved = 1 WHERE id = ' + id_article_collecte, []))),
            map(() => undefined)
        );
    }

    public updateArticlePrepaQuantity(reference: string, idPrepa: number, is_ref: number, quantite: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql(`UPDATE \`article_prepa\` SET quantite = ${quantite} WHERE reference LIKE '${reference}' AND id_prepa = ${idPrepa} AND is_ref LIKE '${is_ref}'`, []))),
            map(() => undefined)
        );
    }

    public updateArticleCollecteQuantity(id_article: number, quantite: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_collecte` SET quantite = ' + quantite + ' WHERE id = ' + id_article, []))),
            map(() => undefined)
        );
    }

    public deletePreparationsById(preparations: Array<number>): Observable<any> {
        const joinedPreparations = preparations.join(',');
        return preparations.length > 0
            ? zip(
                this.executeQuery(`DELETE FROM \`preparation\` WHERE id IN (${joinedPreparations});`, false),
                this.executeQuery(`DELETE FROM \`article_prepa\` WHERE id_prepa IN (${joinedPreparations})`, false)
            )
            : of(undefined);
    }

    /**
     * Call sqlite delete command.
     */
    public deleteBy(table: TableName,
                    where: Array<string> = []): Observable<undefined> {
        const sqlWhereClauses = (where && where.length > 0)
            ? `WHERE ${SqliteService.JoinWhereClauses(where)}`
            : '';
        return this.executeQuery(`DELETE FROM ${table} ${sqlWhereClauses};`, false);
    }

    public resetArticlePrepaByPrepa(ids: Array<number>): Observable<any> {
        const idsJoined = ids.join(',');
        return ids.length > 0
            ? zip(
                this.executeQuery( `UPDATE \`article_prepa\` SET deleted = 0, has_moved = 0, quantite = original_quantity WHERE id_prepa IN (${idsJoined}) ;`, false),
                this.executeQuery( `DELETE FROM \`article_prepa\` WHERE id_prepa IN (${idsJoined}) AND isSelectableByUser = 1;`, false)
            )
            : of(undefined);
    }

    public deleteArticlePrepa(reference: string, id_prepa: string, is_ref: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql(`UPDATE \`article_prepa\` SET deleted = 1 WHERE reference = '${reference}' AND id_prepa = ${id_prepa} AND is_ref = ${is_ref}`, []))),
            map(() => undefined)
        );
    }

    private getValueForQuery(value: any): string {
        return (
            (typeof value === 'string') ? `'${this.escapeQuotes(value)}'` :
            (typeof value === 'boolean') ? `${Number(value)}` :
            ((value === null) || (value === undefined)) ? 'null' :
            (Array.isArray(value) || typeof value === 'object') ? `'${this.escapeQuotes(JSON.stringify(value))}'` :
            `${value}`
        );
    }

    private getComparatorForQuery(value: any): string {
        return (typeof value === 'string') ? 'LIKE' : '=';
    }

    public deleteLivraionsById(livraisons: Array<number>): Observable<any> {
        const joinedLivraisons = livraisons.join(',');
        return livraisons.length > 0
            ? zip(
                this.executeQuery(`DELETE FROM \`livraison\` WHERE id IN (${joinedLivraisons});`, false),
                this.executeQuery(`DELETE FROM \`article_livraison\` WHERE id_livraison IN (${joinedLivraisons})`, false)
            )
            : of(undefined);
    }

    public deleteMouvementsBy(columnName: 'id_prepa'|'id_livraison'|'id_collecte', ids: Array<number>): Observable<any> {
        const idsJoined = ids.join(',');
        return ids.length > 0
            ? this.executeQuery(`DELETE FROM \`mouvement\` WHERE ${columnName} IN (${idsJoined})`, false)
            : of(undefined);
    }

    public deleteCollecteById(collecteIds: Array<number>): Observable<any> {
        const joinedCollecte = collecteIds.join(',');
        return collecteIds.length > 0
            ? zip(
                this.executeQuery(`DELETE FROM \`collecte\` WHERE id IN (${joinedCollecte});`),
                this.executeQuery(`DELETE FROM \`article_collecte\` WHERE id_collecte IN (${joinedCollecte})`)
            )
            : of(undefined);
    }

    public finishPrises(ids: Array<number>): Observable<any> {
        return ids.length > 0
            ? this.executeQuery(`UPDATE \`mouvement_traca\` SET finished = 1 WHERE id IN (${ids.join(',')})`, false)
            : of(undefined);
    }

    private escapeQuotes(str: string): string {
        return (typeof str === 'string')
            ? str.replace(/'/g, "''")
            : str;
    }

    public resetMouvementsTraca(refArticles: Array<string>, type: string, fromStock: boolean): Observable<any> {
        return refArticles.length > 0
            ? this.executeQuery(
                'UPDATE mouvement_traca ' +
                'SET finished = 0 ' +
                `WHERE type LIKE '${type}' ` +
                `  AND fromStock = ${Number(fromStock)} ` +
                `  AND ref_article IN (${refArticles.map((ref) => `'${this.escapeQuotes(ref)}'`).join(',')})`
            )
            : of(undefined);
    }

    public getPrises(fromStock: boolean): Observable<Array<MouvementTraca>> {
        return this
            .executeQuery(`
                SELECT *
                FROM mouvement_traca mouvement_traca
                WHERE id IN (
                    SELECT mouvement_traca_2.id
                    FROM mouvement_traca mouvement_traca_2
                    WHERE mouvement_traca_2.ref_article = mouvement_traca.ref_article
                      AND mouvement_traca_2.fromStock = ${Number(fromStock)}
                    ORDER BY mouvement_traca_2.id DESC
                    LIMIT 1
                )
                AND mouvement_traca.type = 'prise'
            `)
            .pipe(map((articles) => SqliteService.MultiSelectQueryMapper<MouvementTraca>(articles)));
    }

}
