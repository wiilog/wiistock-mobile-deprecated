import {Injectable} from '@angular/core';
import {StorageService} from '@app/common/services/storage.service';
import {Livraison} from '@entities/livraison';
import {from, Observable, of, ReplaySubject, Subject, zip} from 'rxjs';
import {flatMap, map, take, tap} from 'rxjs/operators';
import {Collecte} from '@entities/collecte';
import {Manutention} from '@entities/manutention';
import {MouvementTraca} from '@entities/mouvement-traca';
import {Anomalie} from "@entities/anomalie";
import {ArticlePrepaByRefArticle} from "@entities/article-prepa-by-ref-article";
import {ArticleCollecte} from "@entities/article-collecte";
import {ArticlePrepa} from "@entities/article-prepa";
import {ArticleLivraison} from "@entities/article-livraison";
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Platform} from '@ionic/angular';
import * as moment from 'moment';
import {TablesDefinitions} from '@app/common/services/sqlite/tables-definitions';


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

    public static ResetDataBase(sqliteObject: SQLiteObject): Observable<any> {
        return SqliteService.DropTables(sqliteObject)
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

    private static DropTables(db: SQLiteObject): Observable<any> {
        const dropDatabaseRequests = TablesDefinitions
            .filter(({keepOnConnection}) => !keepOnConnection)
            .map(({name}) => `DROP TABLE IF EXISTS \`${name}\`;`);
        return SqliteService.ExecuteQueryFlatMap(db, dropDatabaseRequests);
    }

    private static JoinWhereClauses(where: Array<string>): string {
        const whereJoined = where
            .map((clause) => `(${clause})`)
            .join(' AND ');
        return `(${whereJoined})`;
    }

    public resetDataBase(): Observable<any> {
        return this.db$.pipe(flatMap((db) => SqliteService.ResetDataBase(db)));
    }

    private importEmplacements(data): Observable<any> {
        let apiEmplacements = data['emplacements'];
        const filled = (apiEmplacements && apiEmplacements.length > 0);

        return filled
            ? this.deleteBy('emplacement')
                .pipe(
                    map(() => {
                        const emplacementValuesStr = apiEmplacements
                            .map((emplacement) => (
                                "(" +
                                emplacement.id + ", " +
                                "'" + this.escapeQuotes(emplacement.label) +
                                "')"
                            ))
                            .join(', ');
                        return 'INSERT INTO `emplacement` (`id`, `label`) VALUES ' + emplacementValuesStr + ';'
                    }),
                    flatMap((query) => this.executeQuery(query, false))
            )
            : of(undefined);
    }

    public importPreparations(data, deleteOld: boolean = true): Observable<any> {
        const prepas = data['preparations'];
        let prepasValues = (prepas || []).map((prepa) => (`(
            ${prepa.id},
            '${prepa.number}',
            NULL,
            NULL,
            0,
            '${this.escapeQuotes(prepa.destination)}',
            '${this.escapeQuotes(prepa.type)}',
            ${prepa.requester ? `'${this.escapeQuotes(prepa.requester)}'` : 'NULL'}
        )`));

        return of(undefined).pipe(
            flatMap(() => deleteOld ? this.deleteBy('`preparation`') : of(undefined)),
            flatMap(() => {
                if (prepasValues.length > 0) {
                    const prepasValuesStr = prepasValues.join(', ');
                    const sqlPrepas = 'INSERT INTO `preparation` (`id`, `numero`, `emplacement`, `date_end`, `started`, `destination`, `type`, `requester`) VALUES ' + prepasValuesStr + ';';
                    return this.executeQuery(sqlPrepas).pipe(map(() => true));
                }
                else {
                    return of(undefined);
                }
            })
        );
    }

    public importManutentions(data): Observable<any> {
        const ret$ = new ReplaySubject<any>(1);

        let manutentions = data['manutentions'];
        let manutValues = [];
        if (manutentions.length === 0) {
            this.findAll('`manutention`').subscribe((manutentionsDB) => {
                this.deleteManutentions(manutentionsDB).then(() => {
                    ret$.next(undefined);
                });
            });
        }
        for (let manut of manutentions) {
            this.findOneById('manutention', manut.id).subscribe((manutInserted) => {
                if (manutInserted === null) {
                    let comment = manut.commentaire === null ? '' : this.escapeQuotes(manut.commentaire);
                    let date = manut.date_attendue ? manut.date_attendue.date : null;
                    manutValues.push(
                        "(" +
                        manut.id + ", " +
                        "'" + date + "'" +
                        ", '" + this.escapeQuotes(manut.demandeur) + "'" +
                        ", '" + this.escapeQuotes(comment) + "'" +
                        ", '" + this.escapeQuotes(manut.source) + "'" +
                        ", '" + this.escapeQuotes(manut.objet) + "'" +
                        ", '" + this.escapeQuotes(manut.destination) + "'" +
                        ")"
                    );
                }
                if (manutentions.indexOf(manut) === manutentions.length - 1) {
                    this.findAll('`manutention`').subscribe((manutentionsDB) => {
                        let manutValuesStr = manutValues.join(', ');
                        let sqlManut = 'INSERT INTO `manutention` (`id`, `date_attendue`, `demandeur`, `commentaire`, `source`, `objet`, `destination`) VALUES ' + manutValuesStr + ';';

                        if (manutentionsDB.length === 0) {
                            if (manutValues.length > 0) {
                                this.executeQuery(sqlManut).subscribe(() => {
                                    ret$.next(true);
                                });
                            }
                            else {
                                ret$.next(undefined);
                            }
                        } else {
                            this.deleteManutentions(manutentionsDB.filter(m => manutentions.find(manut => manut.id === m.id) === undefined)).then(() => {
                                if (manutValues.length > 0) {
                                    this.executeQuery(sqlManut).subscribe(() => {
                                        ret$.next(true);
                                    });
                                }
                                else {
                                    ret$.next(undefined);
                                }
                            });
                        }
                    });
                }
            });
        }
        return ret$;
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
                              ...apiTaking.map((apiPrise) => (
                                  !prises.some(({date}) => (date === apiPrise.date))
                                      ? this.insert('mouvement_traca', apiPrise)
                                      : of(undefined)
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
                    this.update('demande_livraison_article', {to_delete: true}),
                    this.update('demande_livraison_type', {to_delete: true})
                )),
                flatMap(() => (
                    ((demandeLivraisonArticles && demandeLivraisonArticles.length > 0) || (demandeLivraisonTypes && demandeLivraisonTypes.length > 0))
                    ? zip(
                        ...(demandeLivraisonArticles || []).map((article) => this.insert('demande_livraison_article', article)),
                        ...(demandeLivraisonTypes || []).map((type) => this.insert('demande_livraison_type', type)),
                    )
                    : of(undefined)
                ))
            );
    }

    public importArticlesPrepas(data): Observable<any> {
        const ret$ = new ReplaySubject<any>(1);
        let articlesPrepa = data['articlesPrepa'];
        let articlesPrepaValues = [];
        if (articlesPrepa.length === 0) {
            ret$.next(undefined);
        }
        for (let article of articlesPrepa) {
            this.findArticlesByPrepa(article.id_prepa).subscribe((articles) => {
                // TODO remove '=='
                const isArticleAlreadySaved = articles.some((articlePrepa) => (
                    (articlePrepa.reference === article.reference) &&
                    (articlePrepa.is_ref == article.is_ref))
                );
                if (!isArticleAlreadySaved) {
                    articlesPrepaValues.push("(" +
                        null + ", " +
                        "'" + this.escapeQuotes(article.label) + "', " +
                        "'" + this.escapeQuotes(article.reference) + "', " +
                        article.quantity + ", " +
                        article.is_ref + ", " +
                        article.id_prepa + ", " +
                        0 + ", " +
                        "'" + this.escapeQuotes(article.location) + "', " +
                        "'" + article.type_quantite + "', " +
                        "'" + article.barCode + "', " +
                        article.quantity + ", " +
                        "'" + this.escapeQuotes(article.reference_article_reference)  + "')");
                }
                if (articlesPrepa.indexOf(article) === articlesPrepa.length - 1) {
                    if (articlesPrepaValues.length > 0) {
                        let articlesPrepaValuesStr = articlesPrepaValues.join(', ');
                        let sqlArticlesPrepa = 'INSERT INTO `article_prepa` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_prepa`, `has_moved`, `emplacement`, `type_quantite`, `barcode`, `original_quantity`, `reference_article_reference`) VALUES ' + articlesPrepaValuesStr + ';';

                        this.executeQuery(sqlArticlesPrepa).subscribe(() => {
                            ret$.next(true);
                        });
                    } else {
                        ret$.next(undefined);
                    }
                }
            });
        }
        return ret$;
    }

    public importLivraisons(data): Observable<any> {
        const ret$ = new ReplaySubject<any>(1);
        let livraisons = data['livraisons'];
        let livraisonsValues = [];
        if (livraisons.length === 0) {
            this.findAll('`livraison`').subscribe((livraisonsDB) => {
                this.deleteLivraisons(livraisonsDB).then(() => {
                    ret$.next(undefined);
                });
            });
        }
        for (let livraison of livraisons) {
            this.findOneById('livraison', livraison.id).subscribe((livraisonInserted) => {
                if (livraisonInserted === null) {
                    livraisonsValues.push("(" +
                        livraison.id + ", " +
                        "'" + livraison.number + "', " +
                        "'" + this.escapeQuotes(livraison.location) + "', " +
                        "NULL, " +
                        "'" + this.escapeQuotes(livraison.requester) + "', " +
                        "'" + this.escapeQuotes(livraison.type) + "'" +
                    ")");
                }
                if (livraisons.indexOf(livraison) === livraisons.length - 1) {
                    this.findAll('`livraison`').subscribe((livraisonsDB) => {
                        let livraisonsValuesStr = livraisonsValues.join(', ');
                        let sqlLivraisons = 'INSERT INTO `livraison` (`id`, `numero`, `emplacement`, `date_end`, `requester`, `type`) VALUES ' + livraisonsValuesStr + ';';
                        if (livraisonsDB.length === 0) {
                            if(livraisonsValues.length > 0) {
                                this.executeQuery(sqlLivraisons).subscribe(() => {
                                    ret$.next(true);
                                });
                            }
                            else {
                                ret$.next(undefined);
                            }
                        } else {
                            this.deleteLivraisons(livraisonsDB.filter(l => livraisons.find(livr => livr.id === l.id) === undefined)).then(() => {
                                if(livraisonsValues.length > 0) {
                                    this.executeQuery(sqlLivraisons).subscribe(() => {
                                        ret$.next(true);
                                    });
                                }
                                else {
                                    ret$.next(undefined);
                                }
                            });
                        }
                    });
                }
            });
        }
        return ret$;
    }

    public importArticlesLivraison(data): Observable<any> {
        const ret$ = new ReplaySubject<any>(1);
        let articlesLivrs = data['articlesLivraison'];
        let articlesLivraisonValues = [];
        if (articlesLivrs.length === 0) {
            ret$.next(undefined);
        }
        for (let article of articlesLivrs) {
            this.findArticlesByLivraison(article.id_livraison).subscribe((articles) => {
                // TODO '=='
                const found = articles.some((articleLivr) => (
                    (articleLivr.reference === article.reference) &&
                    (articleLivr.is_ref == article.is_ref))
                );
                if (!found) {
                    articlesLivraisonValues.push(
                        "(" +
                        "NULL, " +
                        "'" + this.escapeQuotes(article.label) + "', " +
                        "'" + this.escapeQuotes(article.reference) + "'," +
                        article.quantity + ", " +
                        article.is_ref + ", " +
                        "" + article.id_livraison + ", " +
                        "0, " +
                        "'" + this.escapeQuotes(article.location) + "'," +
                        "'" + article.barCode + "'" +
                        ")");
                }
                if (articlesLivrs.indexOf(article) === articlesLivrs.length - 1) {
                    if (articlesLivraisonValues.length > 0) {
                        let articlesLivraisonValuesStr = articlesLivraisonValues.join(', ');
                        let sqlArticlesLivraison = 'INSERT INTO `article_livraison` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_livraison`, `has_moved`, `emplacement`, `barcode`) VALUES ' + articlesLivraisonValuesStr + ';';
                        this.executeQuery(sqlArticlesLivraison).subscribe(() => {
                            ret$.next(true);
                        });
                    } else {
                        ret$.next(undefined);
                    }
                }
            });
        }
        return ret$;
    }

    /**
     * Import in sqlite api data from collectes and articlesCollecte fields
     * @param data
     */
    public importCollectes(data): Observable<any> {
        const collectesAPI = data['collectes'];
        const articlesCollecteAPI = data['articlesCollecte'];

        return of(undefined).pipe(
            // we clear 'articleCollecte' table and add given articles
            flatMap(() => this.deleteBy('article_collecte')),
            map(() => (
                (articlesCollecteAPI && articlesCollecteAPI.length > 0)
                    ? articlesCollecteAPI.map((articleCollecte) => (
                        "(NULL, " +
                        "'" + this.escapeQuotes(articleCollecte.label) + "', " +
                        "'" + this.escapeQuotes(articleCollecte.reference) + "', " +
                        articleCollecte.quantity + ", " +
                        articleCollecte.is_ref + ", " +
                        articleCollecte.id_collecte + ", " +
                        "0, " +
                        "'" + this.escapeQuotes(articleCollecte.location) + "', " +
                        "'" + articleCollecte.barCode + "')"
                    ))
                    : []
            )),
            flatMap((articlesCollecteValues: Array<string>) => (
                articlesCollecteValues.length > 0
                    ? this.executeQuery(
                        'INSERT INTO `article_collecte` (' +
                        '`id`, ' +
                        '`label`, ' +
                        '`reference`, ' +
                        '`quantite`, ' +
                        '`is_ref`, ' +
                        '`id_collecte`, ' +
                        '`has_moved`, ' +
                        '`emplacement`, ' +
                        '`barcode`' +
                        ') ' +
                        'VALUES ' + articlesCollecteValues.join(',') + ';'
                    )
                    : of(undefined)
            )),

            // we update collecte table
            flatMap(() => this.findAll('collecte')),
            flatMap((collectesDB: Array<Collecte>) => {
                // we delete 'collecte' in sqlite DB if it is not in the api array and if it's not finished
                const collectesIdToDelete = collectesDB
                    .filter(({id: idDB, location_to, date_end}) => (!collectesAPI.some(({id: idAPI}) => ((idAPI === idDB)) && !location_to && !date_end)))
                    .map(({id}) => id);
                return (collectesIdToDelete.length > 0
                    ? this.deleteBy('collecte', [`id IN (${collectesIdToDelete.join(',')}`])
                    : of(undefined)).pipe(map(() => collectesDB));
            }),
            flatMap((collectesDB: Array<Collecte>) => {
                // we add 'collecte' in sqlite DB if it is in the api and not in DB
                const collectesValuesToAdd = collectesAPI
                    .filter(({id: idAPI}) => !collectesDB.some(({id: idDB}) => (idDB === idAPI)))
                    .map(({id, number, location_from, forStock, requester, type}) => ({id, number, location_from, forStock, requester, type}));

                return (collectesValuesToAdd.length > 0
                    ? this.insert('`collecte`', collectesValuesToAdd)
                    : of(undefined));
            }),
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
            "'" + articleCollecte.barCode + "')"
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
                '`barcode`' +
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
                flatMap(() => {
                    const articlesInventaireValues = (articlesInventaire && articlesInventaire.length > 0)
                        ? articlesInventaire.map((article) => (
                            "(NULL, " +
                            "'" + article.id_mission + "', " +
                            "'" + this.escapeQuotes(article.reference) + "', " +
                            article.is_ref + ", " +
                            "'" + this.escapeQuotes(article.location ? article.location : 'N/A') + "', " +
                            "'" + article.barCode + "')"
                        ))
                        : [];

                    let articlesInventaireValuesStr = articlesInventaireValues.join(', ');
                    let sqlArticlesInventaire = 'INSERT INTO `article_inventaire` (`id`, `id_mission`, `reference`, `is_ref`, `location`, `barcode`) VALUES ' + articlesInventaireValuesStr + ';';
                    return articlesInventaireValues.length > 0
                        ? this.executeQuery(sqlArticlesInventaire).pipe(map(() => true))
                        : of(undefined)
                })
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
                map(() => {
                    if ((articlesPrepaByRefArticle && articlesPrepaByRefArticle.length > 0)) {
                        const articleKeys = [
                            ...Object.keys(articlesPrepaByRefArticle[0]),
                            'isSelectableByUser'
                        ];

                        const articleValues = articlesPrepaByRefArticle.map((article) => {
                            const articleTmp = {
                                ...article,
                                isSelectableByUser: 1
                            };
                            return '(' + (articleKeys.map((key) => ("'" + this.escapeQuotes(articleTmp[key]) + "'")).join(', ') + ')')
                        });

                        return (
                            'INSERT INTO `article_prepa_by_ref_article` (' + articleKeys.map((key) => `\`${key}\``).join(', ') + ') ' +
                            'VALUES ' + articleValues + ';'
                        );
                    }
                    else {
                        return undefined;
                    }
                }),
                flatMap((query) => (
                    query
                        ? this.executeQuery(query)
                        : of(undefined)
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
                            "'" + this.escapeQuotes(anomaly.location ? anomaly.location : 'N/A') + "', " +
                            "'" + anomaly.barCode + "')"
                        ));
                    if (anomaliesToInsert.length === 0) {
                        ret$.next(undefined);
                    }
                    else {
                        const anomaliesValuesStr = anomaliesToInsert.join(', ');
                        let sqlAnomaliesInventaire = 'INSERT INTO `anomalie_inventaire` (`id`, `reference`, `is_ref`, `quantity`, `location`, `barcode`) VALUES ' + anomaliesValuesStr + ';';
                        this.executeQuery(sqlAnomaliesInventaire).subscribe(() => {
                            ret$.next(true);
                        });
                    }
                });

        return ret$;
    }

    public importData(data: any): Observable<any> {
        return of(undefined).pipe(
            flatMap(() => this.importEmplacements(data).pipe(tap(() => {console.log('--- > importEmplacements')}))),
            flatMap(() => this.importArticlesPrepaByRefArticle(data).pipe(tap(() => {console.log('--- > importArticlesPrepaByRefArticle')}))),
            flatMap(() => this.importPreparations(data).pipe(tap(() => {console.log('--- > importPreparations')}))),
            flatMap(() => this.importArticlesPrepas(data).pipe(tap(() => {console.log('--- > importArticlesPrepas')}))),
            flatMap(() => this.importLivraisons(data).pipe(tap(() => {console.log('--- > importLivraisons')}))),
            flatMap(() => this.importArticlesLivraison(data).pipe(tap(() => {console.log('--- > importArticlesLivraison')}))),
            flatMap(() => this.importArticlesInventaire(data).pipe(tap(() => {console.log('--- > importArticlesInventaire')}))),
            flatMap(() => this.importManutentions(data).pipe(tap(() => {console.log('--- > importManutentions')}))),
            flatMap(() => this.importCollectes(data).pipe(tap(() => {console.log('--- > importCollectes')}))),
            flatMap(() => this.importMouvementTraca(data).pipe(tap(() => {console.log('--- > importMouvementTraca')}))),
            flatMap(() => this.importDemandesLivraisonData(data).pipe(tap(() => {console.log('--- > importDemandeLivraisonData')}))),
            flatMap(() => (
                this.storageService.getInventoryManagerRight().pipe(
                    flatMap((res) => (res
                        ? this.importAnomaliesInventaire(data)
                        : of(undefined))),
                )
            ))
        );
    }

    public findOneById(table: string, id: number): Observable<any> {
        return this.findOneBy(table, {id});
    }

    public findOneBy(table: string, conditions: {[name: string]: any}, glue: string = 'OR'): Observable<any> {
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

    public count(table: string, where: string[] = []): Observable<number> {
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
     */
    public findBy(table: string, where: Array<string> = []): Observable<any> {
        const sqlWhereClauses = (where && where.length > 0)
            ? ` WHERE ${SqliteService.JoinWhereClauses(where)}`
            : undefined;

        const sqlQuery = 'SELECT * FROM ' + table + (sqlWhereClauses ? sqlWhereClauses : '');
        return this.executeQuery(sqlQuery).pipe(
            map((data) => SqliteService.MultiSelectQueryMapper<any>(data)),
            take(1)
        );
    }

    public findAll(table: string): Observable<any> {
        return this.findBy(table)
    }

    private createInsertQuery(name: string, objects: any|Array<any>): string {
        const isMultiple = Array.isArray(objects);
        const objectKeys = Object.keys(isMultiple ? objects[0] : objects);

        if (!isMultiple) {
            objects = [objects];
        }
        const valuesMap = objects.map((values) =>
            '(' +
            objectKeys.map((key) => this.getValueForQuery(values[key])).join((', ')) +
            ')'
        );
        return "INSERT INTO " + name +
            ' (' + objectKeys.join(', ') + ') ' +
            "VALUES " +
            valuesMap.join(', ');
    }

    private createUpdateQuery(name: string, values: any, where: Array<string>): string {
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

    public insert(name: string, objects: any|Array<any>): Observable<number> {
        let query = this.createInsertQuery(name, objects);
        return this.executeQuery(query).pipe(map(({insertId}) => insertId));
    }

    public update(name: string, values: any, where: Array<string> = []): Observable<any> {
        let query = this.createUpdateQuery(name, values, where);
        return query
            ? this.executeQuery(query)
            : of(false);
    }

    public executeQuery(query: string, getRes: boolean = true, params: Array<any> = []): Observable<any> {
        return this.db$.pipe(
            flatMap((db) => SqliteService.ExecuteQueryStatic(db, query, getRes, params)),
            tap(() => {}, () => {console.error(query);}),
            map((res) => (getRes ? res : undefined))
        );
    }

    public findArticlesByPrepa(id_prepa: number): Observable<Array<ArticlePrepa>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql(`SELECT * FROM \`article_prepa\` WHERE \`id_prepa\` = ${id_prepa} AND deleted <> 1`, []))),
            map((articles) => SqliteService.MultiSelectQueryMapper<ArticlePrepa>(articles))
        );
    }

    public findArticlesByLivraison(id_livr: number): Observable<Array<ArticleLivraison>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `article_livraison` WHERE `id_livraison` = ' + id_livr, []))),
            map((articles) => SqliteService.MultiSelectQueryMapper<ArticleLivraison>(articles))
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

    public resetFinishedLivraisons(id_livraisons: Array<number>): Observable<undefined> {
        const idLivraisonsJoined = id_livraisons.join(',');
        return this.executeQuery(`UPDATE \`livraison\` SET date_end = NULL, emplacement = NULL WHERE id IN (${idLivraisonsJoined})`, false);
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

    public finishLivraison(id_livraison: number, emplacement): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `livraison` SET date_end = \'' + moment().format() + '\', emplacement = \'' + emplacement + '\' WHERE id = ' + id_livraison, []))),
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

    public updateArticleLivraisonQuantity(id_article: number, quantite: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_livraison` SET quantite = ' + quantite + ' WHERE id = ' + id_article, []))),
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

    public deleteManutentions(manutentions: Array<Manutention>) {
        let resp = new Promise<any>((resolve) => {
            if (manutentions.length === 0) {
                resolve();
            }
            else {
                this.db$.subscribe((db) => {
                    const manutentionIds = manutentions.map(({id}) => id).join(', ');
                    db.executeSql(`DELETE FROM \`manutention\` WHERE id IN (${manutentionIds})`, []).then(() => {
                        resolve();
                    }).catch(err => console.log(err));
                });
            }
        });
        return resp;
    }

    public deleteLivraisons(livraisons: Array<Livraison>) {
        let resp = new Promise<any>((resolve) => {
            if (livraisons.length === 0) {
                resolve();
            }
            else {
                this.db$.subscribe((db) => {
                    livraisons.forEach(livraison => {
                        db.executeSql('DELETE FROM `livraison` WHERE id = ' + livraison.id, []).then(() => {
                            db.executeSql('DELETE FROM `article_livraison` WHERE id_livraison = ' + livraison.id, []).then(() => {
                                if (livraisons.indexOf(livraison) === livraisons.length - 1) {
                                    resolve();
                                }
                            }).catch(err => console.log(err));
                        }).catch(err => console.log(err));
                    });
                });
            }
        });
        return resp;
    }

    /**
     * Call sqlite delete command.
     */
    public deleteBy(table: string,
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
