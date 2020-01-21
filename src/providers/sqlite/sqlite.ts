import {SQLite, SQLiteObject} from '@ionic-native/sqlite';
import {Injectable} from '@angular/core';
import {StorageService} from '@app/services/storage.service';
import moment from 'moment';
import {Preparation} from '@app/entities/preparation';
import {Livraison} from '@app/entities/livraison';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {flatMap, map, take} from 'rxjs/operators';
import {from} from 'rxjs/observable/from';
import {of} from 'rxjs/observable/of';
import {Platform} from 'ionic-angular';
import {Collecte} from '@app/entities/collecte';
import {Manutention} from '@app/entities/manutention';
import 'rxjs/add/observable/zip';
import {MouvementTraca} from '@app/entities/mouvement-traca';


@Injectable()
export class SqliteProvider {

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
                flatMap(() => this.sqlite.create({name: SqliteProvider.DB_NAME, location: 'default'})),
                flatMap((sqliteObject: SQLiteObject) => SqliteProvider.ResetDataBase(sqliteObject).pipe(map(() => sqliteObject)))
            )
            .subscribe(
                (sqliteObject: SQLiteObject) => {
                    this.sqliteObject$.next(sqliteObject);
                },
                e => console.log(e)
            );
    }

    private static CreateTables(db): Observable<undefined> {
        return of(undefined).pipe(
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `emplacement` (`id` INTEGER PRIMARY KEY, `label` VARCHAR(255))')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `mouvement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `reference` INTEGER, `quantity` INTEGER, `date_pickup` VARCHAR(255), `location_from` TEXT, `date_drop` VARCHAR(255), `location` TEXT, `type` VARCHAR(255), `is_ref` INTEGER, `id_article_prepa` INTEGER, `id_prepa` INTEGER, `id_article_livraison` INTEGER, `id_livraison` INTEGER, `id_article_collecte` INTEGER, `id_collecte` INTEGER, `selected_by_article` INTEGER)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `mouvement_traca` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `ref_article` VARCHAR(255), `date` VARCHAR(255), `ref_emplacement` VARCHAR(255), `type` VARCHAR(255), `operateur` VARCHAR(255), `comment` VARCHAR(255), `signature` TEXT, finished INTEGER, fromStock INTEGER, quantity INTEGER)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `API_PARAMS` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `url` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'INSERT INTO `API_PARAMS` (url) SELECT (\'\') WHERE NOT EXISTS (SELECT * FROM `API_PARAMS`)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `preparation` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT, `started` INTEGER, `destination` INTEGER, `type` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `article_prepa` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` INTEGER, `id_prepa` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `type_quantite` TEXT, `isSelectableByUser` INTEGER, `barcode` TEXT, `deleted` INTEGER DEFAULT 0, original_quantity INTEGER, reference_article_reference TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `article_prepa_by_ref_article` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,  `reference` TEXT, `label` TEXT, `location` TEXT, `quantity` INTEGER, `reference_article` TEXT, `isSelectableByUser` INTEGER, `barcode` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `livraison` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `collecte` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `location_from` VARCHAR(255), `location_to` VARCHAR(255), `date_end` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `article_livraison` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` INTEGER, `id_livraison` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `barcode` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `article_inventaire` (`id` INTEGER PRIMARY KEY, `id_mission` INTEGER, `reference` TEXT, `is_ref` INTEGER, `location` TEXT, `barcode` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `article_collecte` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` INTEGER, `id_collecte` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `barcode` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `saisie_inventaire` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `id_mission` INTEGER, `date` TEXT, `reference` TEXT, `is_ref` INTEGER, `quantity` INTEGER, `location` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `anomalie_inventaire` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `reference` TEXT, `is_ref` INTEGER, `quantity` INTEGER, `location` TEXT, `comment` TEXT, `treated` TEXT, `barcode` TEXT)')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(db, 'CREATE TABLE IF NOT EXISTS `manutention` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `demandeur` TEXT, `date_attendue` TEXT, `commentaire` TEXT, `destination` TEXT, `source` TEXT)')),
            map(() => undefined)
        );
    }

    public static ResetDataBase(sqliteObject: SQLiteObject): Observable<any> {
        return SqliteProvider.DropTables(sqliteObject)
            .pipe(
                flatMap(() => SqliteProvider.CreateTables(sqliteObject)),
                map(() => undefined),
                take(1)
            );
    }

    private static DropTables(sqliteObject): Observable<any> {
        return of(undefined).pipe(
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `emplacement`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `mouvement_traca`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `preparation`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `article_prepa`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `article_prepa_by_ref_article`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `mouvement`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `collecte`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `livraison`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `article_livraison`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `article_collecte`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `article_inventaire`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `saisie_inventaire`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `anomalie_inventaire`;')),
            flatMap(() => SqliteProvider.ExecuteQueryStatic(sqliteObject, 'DROP TABLE IF EXISTS `manutention`;')),
            map(() => undefined),
            take(1)
        );
    }

    public resetDataBase(): Observable<any> {
        return this.db$.pipe(flatMap((db) => SqliteProvider.ResetDataBase(db)));
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

    public importPreparations(data): Observable<any> {
        const ret$ = new ReplaySubject<any>(1);

        let prepas = data['preparations'];
        let prepasValues = [];
        if (prepas.length === 0) {
            this.findAll('`preparation`').subscribe((preparationsDB) => {
                this.deletePreparations(preparationsDB).subscribe(() => {
                    ret$.next(undefined);
                });
            });
        }
        for (let prepa of prepas) {
            this.findOneById('preparation', prepa.id).subscribe((prepaInserted) => {
                if (!prepaInserted) {
                    prepasValues.push(`(${prepa.id}, '${prepa.number}', NULL, NULL, 0, '${this.escapeQuotes(prepa.destination)}', '${prepa.type}')`);
                }

                if (prepas.indexOf(prepa) === prepas.length - 1) {
                    this.findAll('`preparation`').subscribe((preparations) => {
                        let prepasValuesStr = prepasValues.join(', ');
                        let sqlPrepas = 'INSERT INTO `preparation` (`id`, `numero`, `emplacement`, `date_end`, `started`, `destination`, `type`) VALUES ' + prepasValuesStr + ';';
                        if (preparations.length === 0) {
                            if (prepasValues.length > 0) {
                                this.executeQuery(sqlPrepas).subscribe(() => {
                                    ret$.next(true);
                                });
                            }
                            else {
                                ret$.next(undefined);
                            }
                        } else {
                            this.deletePreparations(preparations.filter(p => prepas.find(prep => prep.id === p.id) === undefined)).subscribe(() => {
                                if (prepasValues.length > 0) {
                                    this.executeQuery(sqlPrepas).subscribe(() => {
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
                        ", '" + this.escapeQuotes(manut.destination) + "'" +
                        ")"
                    );
                }
                if (manutentions.indexOf(manut) === manutentions.length - 1) {
                    this.findAll('`manutention`').subscribe((manutentionsDB) => {
                        let manutValuesStr = manutValues.join(', ');
                        let sqlManut = 'INSERT INTO `manutention` (`id`, `date_attendue`, `demandeur`, `commentaire`, `source`, `destination`) VALUES ' + manutValuesStr + ';';

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
                      of(undefined).pipe(
                          ...apiTaking.map((apiPrise) => (
                              flatMap(() => !prises.some(({date}) => (date === apiPrise.date))
                                  ? this.insert('mouvement_traca', apiPrise)
                                  : of(undefined)
                              )
                          ))
                      )
                  )))
            : of(undefined);
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
                        "null)");
                }
                if (livraisons.indexOf(livraison) === livraisons.length - 1) {
                    this.findAll('`livraison`').subscribe((livraisonsDB) => {
                        let livraisonsValuesStr = livraisonsValues.join(', ');
                        let sqlLivraisons = 'INSERT INTO `livraison` (`id`, `numero`, `emplacement`, `date_end`) VALUES ' + livraisonsValuesStr + ';';
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
                return (collectesIdToDelete.length > 0 ? this.deleteBy('collecte', collectesIdToDelete) : of(undefined)).pipe(map(() => collectesDB));
            }),
            flatMap((collectesDB: Array<Collecte>) => {
                // we add 'collecte' in sqlite DB if it is in the api and not in DB
                const collectesValuesToAdd = collectesAPI
                    .filter(({id: idAPI}) => !collectesDB.some(({id: idDB}) => (idDB === idAPI)))
                    .map(({id, number, location_from}) => this.getCollecteValueFromApi({id, number, location_from}));
                return (collectesValuesToAdd.length > 0
                    ? this.executeQuery(this.getCollecteInsertQuery(collectesValuesToAdd))
                    : of(undefined));
            }),
            map(() => undefined)
        );
    }

    /**
     * Send sql values for insert the collecte
     */
    public getCollecteValueFromApi({id, number, location_from}): string {
        return `(${id}, '${number}', '${location_from}', NULL)`;
    }

    /**
     * Create Sql query to insert given sqlValues
     */
    public getCollecteInsertQuery(collecteValues: Array<string>): string {
        return 'INSERT INTO `collecte` (' +
            '`id`, ' +
            '`numero`, ' +
            '`location_from`, ' +
            '`date_end`' +
            ') ' +
            'VALUES ' + collecteValues.join(',') + ';';
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

    public findArticlesByCollecte(id_col: number): Observable<Array<any>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `article_collecte` WHERE `id_collecte` = ' + id_col, []))),
            map((articles) => {
                const list = [];
                if (articles && articles.rows) {
                    for (let i = 0; i < articles.rows.length; i++) {
                        list.push(articles.rows.item(i));
                    }
                }
                return list;
            })
        );
    }

    public importArticlesInventaire(data): Observable<any> {
        const importExecuted = new ReplaySubject<any>(1);
        let articlesInventaire = data['inventoryMission'];

        let articlesInventaireValues = [];
        if (articlesInventaire.length === 0) {
            this.deleteBy('article_inventaire').subscribe(_ => {
                importExecuted.next(false);
            });
        }

        for (let article of articlesInventaire) {
            articlesInventaireValues.push(
                "(NULL, " +
                "'" + article.id_mission + "', " +
                "'" + this.escapeQuotes(article.reference) + "', " +
                article.is_ref + ", " +
                "'" + this.escapeQuotes(article.location ? article.location : 'N/A') + "', " +
                "'" + article.barCode + "')"
            );

            if (articlesInventaire.indexOf(article) === articlesInventaire.length - 1) {
                let articlesInventaireValuesStr = articlesInventaireValues.join(', ');
                let sqlArticlesInventaire = 'INSERT INTO `article_inventaire` (`id`, `id_mission`, `reference`, `is_ref`, `location`, `barcode`) VALUES ' + articlesInventaireValuesStr + ';';

                if (articlesInventaireValues.length > 0) {
                    this.executeQuery(sqlArticlesInventaire).subscribe(() => {
                        importExecuted.next(true);
                    });
                }
                else {
                    importExecuted.next(undefined);
                }
            }
        }
        return importExecuted;
    }

    private importArticlesPrepaByRefArticle(data): Observable<any> {
        const articlesPrepaByRefArticle = data['articlesPrepaByRefArticle'];

        return this
            .deleteBy('article_prepa_by_ref_article')
            .pipe(
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

                        return 'INSERT INTO `article_prepa_by_ref_article` (' +
                            articleKeys.map((key) => `\`${key}\``).join(', ') + ') VALUES ' +
                            articleValues + ';';
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
            )
    }

    public importAnomaliesInventaire(data): Observable<any> {
        let ret$: ReplaySubject<any> = new ReplaySubject(1);
        let anomalies = data.anomalies;

        this.deleteBy('anomalie_inventaire').subscribe(_ => {
            if (anomalies.length === 0) {
                ret$.next(undefined);
            }
            else {
                const anomaliesValuesStr = anomalies
                    .map((anomaly) => (
                        "(" +
                        anomaly.id + ", " +
                        "'" + this.escapeQuotes(anomaly.reference) + "', " +
                        anomaly.is_ref + ", " +
                        "'" + anomaly.quantity + "', " +
                        "'" + this.escapeQuotes(anomaly.location ? anomaly.location : 'N/A') + "', " +
                        "'" + anomaly.barCode + "')"
                    ))
                    .join(', ');
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
            flatMap(() => this.importEmplacements(data)),
            flatMap(() => this.importArticlesPrepaByRefArticle(data)),
            flatMap(() => this.importPreparations(data)),
            flatMap(() => this.importArticlesPrepas(data)),
            flatMap(() => this.importLivraisons(data)),
            flatMap(() => this.importArticlesLivraison(data)),
            flatMap(() => this.importArticlesInventaire(data)),
            flatMap(() => this.importManutentions(data)),
            flatMap(() => this.importCollectes(data)),
            flatMap(() => this.importMouvementTraca(data)),
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

    public count(table: string, where?: any[]): Observable<number> {
        let query = "SELECT COUNT(*) AS nb FROM " + table;

        let values = [];
        if (where) {
            let res = this.buildQueryWhereClause(where);
            query += res.query;
            values = res.values;
        }

        const countExecuted = new ReplaySubject<number>(1);

        this.db$.subscribe((db) => {
            db.executeSql(query, values).then((data) => {
                let count = 0;
                if (data.rows.length > 0) {
                    let item = data.rows.item(0);
                    count = item.nb;
                }
                countExecuted.next(count);
            });
        });

        return countExecuted;
    }

    /**
     * find all elements in the given table which correspond to the given where clauses.
     * @param {string} table name of the table to do the search
     * @param {string[]} where boolean clauses to apply with AND separator
     */
    public findBy(table: string, where: Array<string> = []): Observable<any> {
        const sqlWhereClauses = where.length > 0
            ? (' WHERE (' + where.join(' AND ') + ')')
            : undefined;

        const sqlQuery = 'SELECT * FROM ' + table + (sqlWhereClauses ? sqlWhereClauses : '');

        return this.executeQuery(sqlQuery).pipe(
            map((data) => {
                let ret;
                if (data) {
                    ret = [];
                    if (data.rows && data.rows.length > 0) {
                        for (let i = 0; i < data.rows.length; i++) {
                            ret.push(data.rows.item(i));
                        }
                    }
                }
                return ret;
            }),
            take(1)
        );
    }

    public findAll(table: string): Observable<any> {
        return this.findBy(table)
    }

    public findByElementNull(table: string, element: string): Observable<Array<any>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM ' + table + 'WHERE ' + element + ' IS NULL', []))),
            map((data) => {
                const list = [];
                if (data && data.rows) {
                    for (let i = 0; i < data.rows.length; i++) {
                        list.push(data.rows.item(i));
                    }
                }
                return list;
            })
        );
    }

    public findByElement(table: string, element: string, value: string): Observable<Array<any>> {
        const query = ('SELECT * FROM ' + table + ' WHERE ' + element + ' LIKE \'%' + value + '%\'');
        return (value !== '')
            ? this.db$.pipe(
                flatMap((db: SQLiteObject) => from(db.executeSql(query, []))),
                map((data) => {
                    const list = [];
                    if (data && data.rows) {
                        for (let i = 0; i < data.rows.length; i++) {
                            list.push(data.rows.item(i));
                        }
                    }
                    return list;
                })
            )
            : of(undefined);
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

    public insert(name: string, objects: any|Array<any>): Observable<number> {
        let query = this.createInsertQuery(name, objects);
        return this.executeQuery(query).pipe(map(({insertId}) => insertId));
    }

    public executeQuery(query: string, getRes: boolean = true, params: Array<any> = []): Observable<any> {
        return this.db$.pipe(
            flatMap((db) => SqliteProvider.ExecuteQueryStatic(db, query, getRes, params)),
            map((res) => (getRes ? res : undefined))
        );
    }


    private buildQueryWhereClause(selections: any[]) {
        let query = "";
        let values = [];
        let i = 0;
        for (let whereValue of selections) {
            if (i == 0) {
                query += " WHERE ";
            }
            else {
                query += " AND ";
            }
            let operator = "=";
            if (whereValue.operator) {
                operator = whereValue.operator;
            }
            query += whereValue.column + " " + operator + " ? ";
            values.push(whereValue.value);
            i++;
        }

        return {query: query, values: values};
    }

    public setAPI_URL(url): Observable<any> {
        const apiUrlSet = new ReplaySubject<any>(1);
        this.db$.subscribe((db) => {
            db.executeSql('UPDATE `API_PARAMS` SET url = \'' + url + '\'', []).then(() => {
                apiUrlSet.next(true);
            }).catch((err) => {
                apiUrlSet.next(err);
            })

        });
        return apiUrlSet;
    }

    public getServerUrl(): Observable<any> {
        return this.db$
            .pipe(
                flatMap((db) => from(db.executeSql('SELECT * FROM `API_PARAMS` LIMIT 1', []))),
                map((data) => (
                    (data && data.rows && data.rows.length > 0 && data.rows.item(0).url !== '')
                        ? data.rows.item(0).url
                        : null
                ))
            );
    }

    public findArticlesByPrepa(id_prepa: number): Observable<Array<any>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql(`SELECT * FROM \`article_prepa\` WHERE \`id_prepa\` = ${id_prepa} AND deleted <> 1`, []))),
            map((articles) => {
                const list = [];
                if (articles && articles.rows) {
                    for (let i = 0; i < articles.rows.length; i++) {
                        list.push(articles.rows.item(i));
                    }
                }
                return list;
            })
        );
    }

    public findArticlesByLivraison(id_livr: number): Observable<Array<any>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `article_livraison` WHERE `id_livraison` = ' + id_livr, []))),
            map((articles) => {
                const list = [];
                if (articles && articles.rows) {
                    for (let i = 0; i < articles.rows.length; i++) {
                        list.push(articles.rows.item(i));
                    }
                }
                return list;
            })
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
        return Observable.zip(
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
        return this.executeQuery(`UPDATE \`mouvement\` SET date_drop = '${moment().format()}' WHERE id = ${id_mvt}${setLocationQuery}`, false);
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

    public deletePreparations(preparations: Array<Preparation>) {
        return this.deletePreparationsById(preparations.map(({id}) => id))
    }

    public deletePreparationsById(preparations: Array<number>): Observable<any> {
        const joinedPreparations = preparations.join(',');
        return preparations.length > 0
            ? Observable.zip(
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
     * Call sqlite delete command. If ids is undefined, it clean the table
     */
    public deleteBy(table: string, ids: number|Array<number> = undefined): Observable<undefined> {
        const whereClause = ids
            ? (
                ' WHERE ' + (Array.isArray(ids)
                    ? `id IN (${ids.join(',')})`
                    : `id = ${ids}`)
            )
            : '';
        return this.executeQuery(`DELETE FROM ${table}${whereClause};`, false);
    }

    public resetArticlePrepaByPrepa(ids: Array<number>): Observable<any> {
        const idsJoined = ids.join(',');
        return ids.length > 0
            ? Observable.zip(
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
            ? Observable.zip(
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
            ? Observable.zip(
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

}
