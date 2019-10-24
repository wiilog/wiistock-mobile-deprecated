import {SQLite, SQLiteObject} from "@ionic-native/sqlite";
import {Injectable} from '@angular/core';
import {StorageService} from '@app/services/storage.service';
import moment from 'moment';
import {Preparation} from '@app/entities/preparation';
import {Mouvement} from '@app/entities/mouvement';
import {Livraison} from '@app/entities/livraison';
import {Anomalie} from '@app/entities/anomalie';
import {Observable, ReplaySubject, Subject} from 'rxjs';
import {flatMap, map, take} from 'rxjs/operators';
import {from} from 'rxjs/observable/from';
import {of} from 'rxjs/observable/of';
import {Platform} from 'ionic-angular';
import {Collecte} from "@app/entities/collecte";
import {Manutention} from "@app/entities/manutention";


@Injectable()
export class SqliteProvider {

    private static readonly DB_NAME: string = 'follow_gt';

    private sqliteObject$: Subject<SQLiteObject>;
    private dbCreated$: Subject<boolean>;

    public constructor(private sqlite: SQLite,
                       private storageService: StorageService,
                       private platform: Platform) {
        this.sqliteObject$ = new ReplaySubject<SQLiteObject>(1);
        this.dbCreated$ = new ReplaySubject<boolean>(1);

        this.createDB();
        this.createTables();
    }

    private get db$(): Observable<SQLiteObject> {
        return this.sqliteObject$.pipe(take(1));
    }

    private get isDBCreated$(): Observable<boolean> {
        return this.dbCreated$.pipe(take(1));
    }

    private createDB(): void {
        // We wait sqlite plugin loading and we create the database
        from(this.platform.ready())
            .pipe(flatMap(() => this.sqlite.create({
                name: SqliteProvider.DB_NAME,
                location: 'default'
            })))
            .subscribe(
                (sqliteObject: SQLiteObject) => {
                    this.sqliteObject$.next(sqliteObject);
                },
                e => console.log(e)
            );
    }

    private createTables(): void {
        this.db$.pipe(
            flatMap((db) => from(Promise.all([
                db.executeSql('DROP TABLE IF EXISTS `article_collecte`', []),
                db.executeSql('DROP TABLE IF EXISTS `article`', []),
                db.executeSql('DROP TABLE IF EXISTS `article_livraison`', []),
                db.executeSql('DROP TABLE IF EXISTS `article_prepa`', []),
                db.executeSql('DROP TABLE IF EXISTS `article_inventaire`', []),
                db.executeSql('DROP TABLE IF EXISTS `anomalie_inventaire`', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `article` (`id` INTEGER PRIMARY KEY, `reference` VARCHAR(255), `quantite` INTEGER, `barcode` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `emplacement` (`id` INTEGER PRIMARY KEY, `label` VARCHAR(255))', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `reference` INTEGER, `quantity` INTEGER, `date_pickup` VARCHAR(255), `location_from` TEXT, `date_drop` VARCHAR(255), `location` TEXT, `type` VARCHAR(255), `is_ref` TEXT, `id_article_prepa` INTEGER, `id_prepa` INTEGER, `id_article_livraison` INTEGER, `id_livraison` INTEGER, `id_article_collecte` INTEGER, `id_collecte` INTEGER)', []),
                db.executeSql('DROP TABLE IF EXISTS `mouvement_traca`', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement_traca` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `ref_article` INTEGER, `date` VARCHAR(255), `ref_emplacement` VARCHAR(255), `type` VARCHAR(255), `operateur` VARCHAR(255))', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `API_PARAMS` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `url` TEXT)', []),
                db.executeSql('INSERT INTO `API_PARAMS` (url) SELECT (\'\') WHERE NOT EXISTS (SELECT * FROM `API_PARAMS`)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `preparation` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT, `started` INTEGER)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `article_prepa` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` TEXT, `id_prepa` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `barcode` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `livraison` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `collecte` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `article_livraison` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` TEXT, `id_livraison` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `barcode` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `article_collecte` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` TEXT, `id_collecte` INTEGER, `has_moved` INTEGER, `emplacement` TEXT, `barcode` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `article_inventaire` (`id` INTEGER PRIMARY KEY, `id_mission` INTEGER, `reference` TEXT, `is_ref` TEXT, `location` TEXT, `code_barre` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `saisie_inventaire` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `id_mission` INTEGER, `date` TEXT, `reference` TEXT, `is_ref` TEXT, `quantity` INTEGER, `location` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `anomalie_inventaire` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `reference` TEXT, `is_ref` TEXT, `quantity` INTEGER, `location` TEXT, `comment` TEXT, `treated` TEXT, `barcode` TEXT)', []),
                db.executeSql('CREATE TABLE IF NOT EXISTS `manutention` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `demandeur` TEXT, `date_attendue` TEXT, `commentaire` TEXT, `destination` TEXT, `source` TEXT)', [])
            ])))
        )
            .subscribe(() => {
                this.dbCreated$.next(true);
            });
    }

    public cleanDataBase(fromAfter = false): Observable<any> {
        const databaseCleaned = new ReplaySubject<SQLiteObject>(1);
        this.isDBCreated$
            .pipe(
                flatMap(() => this.db$),
                flatMap((db) => from(Promise.all([
                    db.executeSql('DELETE FROM `article`;', []),
                    db.executeSql('DELETE FROM `emplacement`;', []),
                    db.executeSql('DELETE FROM `mouvement_traca`;', []),
                    ...(
                        !fromAfter
                            ? [
                                db.executeSql('DELETE FROM `preparation`;', []),
                                db.executeSql('DELETE FROM `article_prepa`;', []),
                                db.executeSql('DELETE FROM `mouvement`;', []),
                                db.executeSql('DELETE FROM `livraison`;', []),
                                db.executeSql('DELETE FROM `collecte`;', []),
                                db.executeSql('DELETE FROM `article_livraison`;', []),
                                db.executeSql('DELETE FROM `article_collecte`;', []),
                                db.executeSql('DELETE FROM `article_inventaire`;', []),
                                db.executeSql('DELETE FROM `saisie_inventaire`;', []),
                                db.executeSql('DELETE FROM `anomalie_inventaire`;', []),
                                db.executeSql('DELETE FROM `manutention`;', []),
                            ]
                            : []
                    )
                ])))
            )
            .subscribe(() => {
                databaseCleaned.next(undefined);
            });

        return databaseCleaned.pipe(take(1));
    }

    public setOperateur(operateur) {
        return new Promise<any>(resolve => {
            this.storageService.setOperateur(operateur).then(() => {
                resolve();
            });
        });
    }

    public getOperateur() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.getOperateur().then((value) => {
                resolve(value);
            });
        });
    }

    initPrepsCount(data, refresh) {
        return new Promise<any>((resolve) => {
            if (!refresh) {
                this.storageService.setApiKey(data['apiKey']);
                this.storageService.setInventoryManagerRight(data['isInventoryManager']);
                this.storageService.setPreps().then(() => {
                    resolve();
                })
            } else {
                resolve();
            }
        });
    }

    importArticles(data) {
        return new Promise<any>((resolve) => {
            let articles = data['articles'];
            let articleValues = [];
            articles.forEach((article) => {
                articleValues.push("(" + null + ", '" + article.reference + "', " + (article.quantiteStock || article.quantiteStock === 0 ? article.quantiteStock : article.quantite) + ", '" + article.barCode + "')");
            });
            let articleValuesStr = articleValues.join(', ');
            let sqlArticles = 'INSERT INTO `article` (`id`, `reference`, `quantite`, `barcode`) VALUES ' + articleValuesStr + ';';
            resolve(sqlArticles);
        });
    }

    importEmplacements(data) {
        return new Promise<any>((resolve) => {
            let emplacements = data['emplacements'];
            let emplacementValues = [];
            emplacements.forEach((emplacement) => {
                emplacementValues.push("(" + emplacement.id + ", '" + emplacement.label.replace(/(\"|\')/g, "\'$1") + "')");
            });
            let emplacementValuesStr = emplacementValues.join(', ');
            let sqlEmplacements = 'INSERT INTO `emplacement` (`id`, `label`) VALUES ' + emplacementValuesStr + ';';
            resolve(sqlEmplacements);
        });
    }

    importPreparations(data) {
        return new Promise<any>((resolve) => {
            let prepas = data['preparations'];
            let prepasValues = [];
            if (prepas.length === 0) {
                this.findAll('`preparation`').subscribe((preparationsDB) => {
                    this.deletePreparations(preparationsDB).then(() => {
                        resolve(false);
                    });
                });
            }
            for (let prepa of prepas) {
                this.findOne('preparation', prepa.id).subscribe((prepaInserted) => {
                    if (prepaInserted === null) {
                        prepasValues.push("(" + prepa.id + ", '" + prepa.number + "', " + null + ", " + null + ", 0)");
                    }
                    if (prepas.indexOf(prepa) === prepas.length - 1) {
                        this.findAll('`preparation`').subscribe((preparations) => {
                            let prepasValuesStr = prepasValues.join(', ');
                            let sqlPrepas = 'INSERT INTO `preparation` (`id`, `numero`, `emplacement`, `date_end`, `started`) VALUES ' + prepasValuesStr + ';';
                            if (preparations.length === 0) {
                                resolve(sqlPrepas);
                            } else {
                                this.deletePreparations(preparations.filter(p => prepas.find(prep => prep.id === p.id) === undefined)).then(() => {
                                    resolve(sqlPrepas);
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    importManutentions(data) {
        return new Promise<any>(resolve => {
            let manutentions = data['manutentions'];
            let manutValues = [];
            if (manutentions.length === 0) {
                this.findAll('`manutention`').subscribe((manutentionsDB) => {
                    this.deleteManutentions(manutentionsDB).then(() => {
                        resolve(false);
                    });
                });
            }
            for (let manut of manutentions) {
                this.findOne('manutention', manut.id).subscribe((manutInserted) => {
                    if (manutInserted === null) {
                        let comment = manut.commentaire === null ? '' : this.escapeQuotes(manut.commentaire);
                        manutValues.push("(" + manut.id + ", '" + manut.date_attendue.date + "', '" + manut.demandeur + "', '" + comment + "', '" + manut.source + "', '" + manut.destination + "')");
                    }
                    if (manutentions.indexOf(manut) === manutentions.length - 1) {
                        this.findAll('`manutention`').subscribe((manutentionsDB) => {
                            let manutValuesStr = manutValues.join(', ');
                            let sqlManut = 'INSERT INTO `manutention` (`id`, `date_attendue`, `demandeur`, `commentaire`, `source`, `destination`) VALUES ' + manutValuesStr + ';';

                            if (manutentionsDB.length === 0) {
                                resolve(sqlManut);
                            } else {
                                this.deleteManutentions(manutentionsDB.filter(m => manutentions.find(manut => manut.id === m.id) === undefined)).then(() => {
                                    resolve(sqlManut);
                                });
                            }
                        });
                    }
                });
            }

        });
    }

    escapeQuotes(string) {
        return string.replace(/'/g, "\''");
    }

    importArticlesPrepas(data) {
        return new Promise<any>((resolve) => {
            let articlesPrepa = data['articlesPrepa'];
            let articlesPrepaValues = [];
            if (articlesPrepa.length === 0) {
                resolve(false);
            }
            for (let article of articlesPrepa) {
                this.findArticlesByPrepa(article.id_prepa).subscribe((articles) => {
                    if (articles.find(articlePrepa => articlePrepa.reference === article.reference && articlePrepa.is_ref === article.is_ref) === undefined) {
                        articlesPrepaValues.push("(" + null + ", '" + article.label + "', '" + article.reference + "', " + article.quantity + ", '" + article.is_ref + "', " + article.id_prepa + ", " + 0 + ", '" + article.location + "', '" + article.barCode + "')");
                    }
                    if (articlesPrepa.indexOf(article) === articlesPrepa.length - 1) {
                        let articlesPrepaValuesStr = articlesPrepaValues.join(', ');
                        let sqlArticlesPrepa = 'INSERT INTO `article_prepa` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_prepa`, `has_moved`, `emplacement`, `barcode`) VALUES ' + articlesPrepaValuesStr + ';';
                        resolve(sqlArticlesPrepa);
                    }
                });
            }
        });
    }

    importLivraisons(data) {
        return new Promise<any>((resolve) => {
            let livraisons = data['livraisons'];
            let livraisonsValues = [];
            if (livraisons.length === 0) {
                this.findAll('`livraison`').subscribe((livraisonsDB) => {
                    this.deleteLivraisons(livraisonsDB).then(() => {
                        resolve(false);
                    });
                });
            }
            for (let livraison of livraisons) {
                this.findOne('livraison', livraison.id).subscribe((livraisonInserted) => {
                    if (livraisonInserted === null) {
                        livraisonsValues.push("(" + livraison.id + ", '" + livraison.number + "', '" + livraison.location + "', " + null + ")");
                    }
                    if (livraisons.indexOf(livraison) === livraisons.length - 1) {
                        this.findAll('`livraison`').subscribe((livraisonsDB) => {
                            let livraisonsValuesStr = livraisonsValues.join(', ');
                            let sqlLivraisons = 'INSERT INTO `livraison` (`id`, `numero`, `emplacement`, `date_end`) VALUES ' + livraisonsValuesStr + ';';
                            if (livraisonsDB.length === 0) {
                                resolve(sqlLivraisons);
                            } else {
                                this.deleteLivraisons(livraisonsDB.filter(l => livraisons.find(livr => livr.id === l.id) === undefined)).then(() => {
                                    resolve(sqlLivraisons);
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    importArticlesLivraison(data) {
        return new Promise<any>((resolve) => {
            let articlesLivrs = data['articlesLivraison'];
            let articlesLivraisonValues = [];
            if (articlesLivrs.length === 0) {
                resolve(false);
            }
            for (let article of articlesLivrs) {
                this.findArticlesByLivraison(article.id_livraison).subscribe((articles) => {
                    if (articles.find(articleLivr => articleLivr.reference === article.reference && articleLivr.is_ref === article.is_ref) === undefined) {
                        articlesLivraisonValues.push("(" + null + ", '" + article.label + "', '" + article.reference + "', " + article.quantity + ", '" + article.is_ref + "', " + article.id_livraison + ", " + 0 + ", '" + article.location + "', '" + article.barCode + "')");
                    }
                    if (articlesLivrs.indexOf(article) === articlesLivrs.length - 1) {
                        let articlesLivraisonValuesStr = articlesLivraisonValues.join(', ');
                        let sqlArticlesLivraison = 'INSERT INTO `article_livraison` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_livraison`, `has_moved`, `emplacement`, `barcode`) VALUES ' + articlesLivraisonValuesStr + ';';
                        resolve(sqlArticlesLivraison)
                    }
                });
            }
        });
    }

    importCollectes(data) {
        return new Promise<any>((resolve) => {
            let collectes = data['collectes'];
            let collectesValues = [];
            if (collectes.length === 0) {
                this.findAll('`collecte`').subscribe((collecteDB) => {
                    this.deleteCollectes(collecteDB).then(() => {
                        resolve(false);
                    });
                });
            }
            for (let collecte of collectes) {
                this.findOne('collecte', collecte.id).subscribe((collecteInserted) => {
                    if (collecteInserted === null) {
                        collectesValues.push("(" + collecte.id + ", '" + collecte.number + "', '" + collecte.location + "', " + null + ")");
                    }
                    if (collectes.indexOf(collecte) === collectes.length - 1) {
                        this.findAll('`collecte`').subscribe((collectesDB) => {
                            let collectesValuesStr = collectesValues.join(', ');
                            let sqlCollectes = 'INSERT INTO `collecte` (`id`, `numero`, `emplacement`, `date_end`) VALUES ' + collectesValuesStr + ';';
                            if (collectesDB.length === 0) {
                                resolve(sqlCollectes);
                            } else {
                                this.deleteCollectes(collectesDB.filter(c => collectes.find(col => col.id === c.id) === undefined)).then(() => {
                                    resolve(sqlCollectes);
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    importArticlesCollecte(data) {
        return new Promise<any>((resolve) => {
            let articlesCols = data['articlesCollecte'];
            let articlesCollecteValues = [];
            if (articlesCols.length === 0) {
                resolve(false);
            }
            for (let article of articlesCols) {
                this.findArticlesByCollecte(article.id_collecte).subscribe((articles) => {
                    if (articles.find(articleCol => articleCol.reference === article.reference && articleCol.is_ref === article.is_ref) === undefined) {
                        articlesCollecteValues.push("(" + null + ", '" + article.label + "', '" + article.reference + "', " + article.quantity + ", '" + article.is_ref + "', " + article.id_collecte + ", " + 0 + ", '" + article.location + "', '" + article.barCode + "')");
                    }
                    if (articlesCols.indexOf(article) === articlesCols.length - 1) {
                        let articlesCollectesValuesStr = articlesCollecteValues.join(', ');
                        let sqlArticlesCollecte = 'INSERT INTO `article_collecte` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_collecte`, `has_moved`, `emplacement`, `barcode`) VALUES ' + articlesCollectesValuesStr + ';';
                        resolve(sqlArticlesCollecte)
                    }
                });
            }
        });
    }

    importArticlesInventaire(data): Observable<any> {

        const importExecuted = new ReplaySubject<any>(1);
        let articlesInventaire = data['inventoryMission'];

        let articlesInventaireValues = [];
        if (articlesInventaire.length === 0) {
            importExecuted.next(false);
        }

        for (let article of articlesInventaire) {
            articlesInventaireValues.push("(" + null + ", '" + article.id_mission + "', '" + article.reference + "', '" + article.is_ref + "', '" + (article.location ? article.location : 'N/A') + "', '" + article.barCode + "')");

            if (articlesInventaire.indexOf(article) === articlesInventaire.length - 1) {
                let articlesInventaireValuesStr = articlesInventaireValues.join(', ');
                let sqlArticlesInventaire = 'INSERT INTO `article_inventaire` (`id`, `id_mission`, `reference`, `is_ref`, `location`, `barcode`) VALUES ' + articlesInventaireValuesStr + ';';
                importExecuted.next(sqlArticlesInventaire);
            }
        }
        return importExecuted;
    }

    public importAnomaliesInventaire(data): Observable<any> {

        const importExecuted = new ReplaySubject<any>(1);

        let anomalies = data.data;

        let anomaliesValues = [];
        if (anomalies.length === 0) {
            importExecuted.next(false);
        } else {
            for (let anomaly of anomalies) {
                anomaliesValues.push("(" + null + ", '" + anomaly.reference + "', '" + anomaly.is_ref + "', '" + anomaly.quantity + "', '" + (anomaly.location ? anomaly.location : 'N/A') + "', '" + anomaly.barCode + "')");

                if (anomalies.indexOf(anomaly) === anomalies.length - 1) {
                    let anomaliesValuesStr = anomaliesValues.join(', ');
                    let sqlAnomaliesInventaire = 'INSERT INTO `anomalie_inventaire` (`id`, `reference`, `is_ref`, `quantity`, `location`, `barcode`) VALUES ' + anomaliesValuesStr + ';';
                    importExecuted.next(sqlAnomaliesInventaire);
                }
            }
        }
        return importExecuted;
    }

    public executeAllImports(imports: Array<string>): Observable<any> {
        const allImportExecuted = new ReplaySubject<undefined>(1);

        this.db$.subscribe((db) => {
            imports.forEach(function (importSql, index) {
                db.executeSql(importSql, []).then().catch(err => console.log(importSql, err)).then(() => {
                    if (index === imports.length - 1) {
                        allImportExecuted.next(undefined);
                    }
                })
            })
        });
        return allImportExecuted;
    }

    public async importData(data, refresh = false) {
        return new Promise<any>((resolve) => {
            let imports = [];
            this.initPrepsCount(data, refresh).then(() => {
                this.importArticles(data).then((sqlArticles) => {
                    if (sqlArticles !== false) imports.push(sqlArticles);
                    this.importEmplacements(data).then((sqlEmplacements) => {
                        if (sqlEmplacements !== false) imports.push(sqlEmplacements);
                        this.importPreparations(data).then((sqlPrepas) => {
                            if (sqlPrepas !== false) imports.push(sqlPrepas);
                            this.importArticlesPrepas(data).then((sqlArticlesPrepa) => {
                                if (sqlArticlesPrepa !== false) imports.push(sqlArticlesPrepa);
                                this.importLivraisons(data).then((sqlLivraisons) => {
                                    if (sqlLivraisons !== false) imports.push(sqlLivraisons);
                                    this.importArticlesLivraison(data).then((sqlArticlesLivraison) => {
                                        if (sqlArticlesLivraison !== false) imports.push(sqlArticlesLivraison);
                                        this.importArticlesInventaire(data).subscribe((sqlArticlesInventaire) => {
                                            if (sqlArticlesInventaire !== false) imports.push(sqlArticlesInventaire);
                                            this.importManutentions(data).then((sqlManutentions) => {
                                                if (sqlManutentions !== false) imports.push(sqlManutentions);
                                                this.importCollectes(data).then((sqlCollectes) => {
                                                    if (sqlCollectes !== false) imports.push(sqlCollectes);
                                                    this.importArticlesCollecte(data).then((sqlArticlesCollecte) => {
                                                        if (sqlArticlesCollecte !== false) imports.push(sqlArticlesCollecte);
                                                        this.executeAllImports(imports).subscribe(() => {
                                                            resolve();
                                                        })
                                                    });
                                                });
                                            });

                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    };

    public findOne(table: string, id: number): Observable<any> {
        let query: string = "SELECT * FROM " + table + " WHERE id = ? ";

        const findOneExecuted = new ReplaySubject<any>(1);

        this.db$.subscribe((db) => {
            db.executeSql(query, [id]).then((data) => {
                let object = null;
                if (data.rows.length > 0) {
                    object = data.rows.item(0);
                }
                findOneExecuted.next(object);
            });
        });
        return findOneExecuted;
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

    public findAll(table: string): Observable<any> {
        const findAllExecuted = new ReplaySubject<any>(1);
        this.db$.subscribe((db) => {
            db.executeSql('SELECT * FROM ' + table, [])
                .then((data) => {
                    if (data == null) {
                        findAllExecuted.next(undefined);
                    } else {
                        const list = [];
                        if (data.rows) {
                            if (data.rows.length > 0) {
                                for (let i = 0; i < data.rows.length; i++) {
                                    list.push(data.rows.item(i));
                                }
                            }
                        }
                        findAllExecuted.next(list);
                    }
                });
        });
        return findAllExecuted;
    }

    public async priseAreUnfinished() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.prisesAreUnfinished().then((value) => {
                console.log(value);
                resolve(value);
            });
        });
    }

    public async clearStorage() {
        return new Promise((resolve, reject) => {
            resolve(this.storageService.clear());
        });
    }

    public async setPriseValue(value, number) {
        return new Promise((resolve, reject) => {
            resolve(this.storageService.setPriseValue(value, number));
        });
    }

    public async keyExists(key) {
        return new Promise<any>((resolve, reject) => {
            this.storageService.keyExists(key).then((value) => {
                resolve(value);
            });
        });
    }

    public async setDeposeValue(value, number) {
        return new Promise((resolve, reject) => {
            resolve(this.storageService.setDeposeValue(value, number));
        });
    };

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

    public insert(name: string, object: any): Observable<number> {
        let values = [];
        let query = "INSERT INTO " + name + " VALUES (";
        Object.keys(object).forEach((key) => {
            values.push(object[key]);
            query += '?, '
        });
        query = query.slice(0, -2) + ");";
        const insertExecuted = new ReplaySubject<any>(1);
        this.db$.subscribe((db) => {
            db.executeSql(query, values).then((id) => {
                insertExecuted.next(id.insertId);
            }).catch(err => console.log(err));

        });
        return insertExecuted;
    }

    public executeQuery(query: string): Observable<any> {
        return this.db$.pipe(flatMap((db) => from(db.executeSql(query, []))));
    }


    private buildQueryWhereClause(selections: any[]) {
        let query = "";
        let values = []
        let i = 0;
        for (let whereValue of selections) {
            if (i == 0) {
                query += " WHERE ";

            } else {
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

    public getAPI_URL(): Observable<any> {
        const apiUrl$ = new ReplaySubject<any>(1);
        this.db$.subscribe((db) => {
            db.executeSql('SELECT * FROM `API_PARAMS` LIMIT 1', []).then((data) => {
                if (data && data.rows && data.rows.length > 0 && data.rows.item(0).url !== '') {
                    apiUrl$.next(data.rows.item(0).url);
                } else {
                    apiUrl$.next(null);
                }
            }).catch((err) => {
                console.log(err);
                apiUrl$.next(false);
            });
        });
        return apiUrl$;
    }

    public getApiKey() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.getApiKey().then((value) => {
                resolve(value);
            });
        });
    }

    public getInventoryManagerRight() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.getInventoryManagerRight().then((value) => {
                resolve(value);
            });
        });
    }

    public finishPrepaStorage() {
        return new Promise<any>((resolve) => {
            this.storageService.addPrep().then(() => {
                resolve();
            });
        })
    }

    public getFinishedPreps() {
        return new Promise<any>((resolve) => {
            this.storageService.getPreps().then((preps) => {
                resolve(preps);
            })
        });
    }

    public initPreps() {
        return this.storageService.setPreps();
    }

    public findArticlesByPrepa(id_prepa: number): Observable<Array<any>> {
        return this.db$.pipe(
            flatMap((db: SQLiteObject) => from(db.executeSql('SELECT * FROM `article_prepa` WHERE `id_prepa` = ' + id_prepa, []))),
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

    public findMvtByArticle(id_art: number): Observable<any> {
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

    public finishCollecte(id_collecte: number, emplacement): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `collecte` SET date_end = \'' + moment().format() + '\', emplacement = \'' + emplacement + '\' WHERE id = ' + id_collecte, []))),
            map(() => undefined)
        );
    }

    public finishMvt(id_mvt: number, location_to: string): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `mouvement` SET date_drop = \'' + moment().format() + '\', location = \'' + location_to + '\' WHERE id = ' + id_mvt, []))),
            map(() => undefined)
        );
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

    public moveArticleCollecte(id_collecte: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_collecte` SET has_moved = 1 WHERE id = ' + id_collecte, []))),
            map(() => undefined)
        );
    }

    public updateArticleQuantity(id_article: number, quantite: number): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('UPDATE `article_prepa` SET quantite = ' + quantite + ' WHERE id = ' + id_article, []))),
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

        let resp = new Promise<any>((resolve) => {
            if (preparations.length === 0) {
                resolve();
            } else {
                this.db$.subscribe((db) => {
                    preparations.forEach(preparation => {
                        db.executeSql('DELETE FROM `preparation` WHERE id = ' + preparation.id, []).then(() => {
                            db.executeSql('DELETE FROM `article_prepa` WHERE id_prepa = ' + preparation.id, []).then(() => {
                                if (preparations.indexOf(preparation) === preparations.length - 1) {
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

    public deleteManutentions(manutentions: Array<Manutention>) {
        let resp = new Promise<any>((resolve) => {
            if (manutentions.length === 0) {
                resolve();
            } else {
                this.db$.subscribe((db) => {
                    manutentions.forEach(manutention => {
                        db.executeSql('DELETE FROM `manutention` WHERE id = ' + manutention.id, []).then(() => {
                            resolve();
                        }).catch(err => console.log(err));
                    });
                });
            }
        });
        return resp;
    }

    public deleteLivraisons(livraisons: Array<Livraison>) {
        let resp = new Promise<any>((resolve) => {
            if (livraisons.length === 0) {
                resolve();
            } else {
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

    public deleteCollectes(collectes: Array<Collecte>) {
        let resp = new Promise<any>((resolve) => {
            if (collectes.length === 0) {
                resolve();
            } else {
                this.db$.subscribe((db) => {
                    collectes.forEach(collecte => {
                        db.executeSql('DELETE FROM `collecte` WHERE id = ' + collecte.id, []).then(() => {
                            db.executeSql('DELETE FROM `article_collecte` WHERE id_collecte = ' + collecte.id, []).then(() => {
                                if (collectes.indexOf(collecte) === collectes.length - 1) {
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

    public deleteAnomalies(anomalies: Array<Anomalie>) {
        let resp = new Promise<any>((resolve) => {
            if (anomalies.length === 0) {
                resolve();
            } else {
                this.db$.subscribe((db) => {
                    anomalies.forEach(anomaly => {
                        db.executeSql('DELETE FROM `anomalie_inventaire` WHERE id = ' + anomaly.id, []).then(() => {
                        }).catch(err => console.log(err));
                    });
                });
            }
        });
        return resp;
    }

    public deleteMvts(mvts: Array<Mouvement>) {
        let resp = new Promise<any>((resolve) => {
            this.db$.subscribe((db) => {
                mvts.forEach(mouvement => {
                    db.executeSql('DELETE FROM `mouvement` WHERE id = ' + mouvement.id, []).then(() => {
                        if (mvts.indexOf(mouvement) === mvts.length - 1) resolve();
                    }).catch(err => console.log(err));
                });
            });
        });
        return resp;
    }

    public deleteById(table, id): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('DELETE FROM ' + table + 'WHERE id = ' + id, []))),
            map(() => undefined)
        );
    }

    public cleanTable(table): Observable<undefined> {
        return this.db$.pipe(
            flatMap((db) => from(db.executeSql('DELETE FROM ' + table + ';', []))),
            map(() => undefined)
        );
    }
}
