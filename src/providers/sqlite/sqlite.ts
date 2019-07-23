import {SQLite, SQLiteObject} from "@ionic-native/sqlite";
import {Injectable} from '@angular/core';
import {StorageService} from "../../app/services/storage.service";
import moment from "moment";
import {Preparation} from "../../app/entities/preparation";
import {Mouvement} from "../../app/entities/mouvement";

const DB_NAME: string = 'follow_gt';


@Injectable()
export class SqliteProvider {

    private db: SQLiteObject = null;

    constructor(private sqlite: SQLite, private storageService: StorageService) {
        this.createDbFile();
    }

    private createDbFile(): void {
        this.sqlite.create({
            name: DB_NAME,
            location: 'default'
        })
            .then((db: SQLiteObject) => {
                console.log('bdd créée');
                this.db = db;
                this.createTables();
            })
            .catch(e => console.log(e));
    }

    private createTables(): void {
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `article` (`id` INTEGER PRIMARY KEY, `reference` VARCHAR(255), `quantite` INTEGER)', [])
            .then(() => {
                console.log('table article créée');
                this.db.executeSql('CREATE TABLE IF NOT EXISTS `emplacement` (`id` INTEGER PRIMARY KEY, `label` VARCHAR(255))', [])
                    .then(() => {
                        console.log('table emplacement créée !')
                        this.db.executeSql('DROP TABLE IF EXISTS `mouvement`', []).then(() => {
                            this.db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `reference` INTEGER, `quantity` INTEGER, `date_pickup` VARCHAR(255), `location_from` TEXT, `date_drop` VARCHAR(255), `location_to` TEXT, `type` VARCHAR(255), `is_ref` TEXT, `id_article_prepa` INTEGER)', [])
                                .then(() => {
                                    console.log('table mouvement créée !')
                                    this.db.executeSql('DROP TABLE IF EXISTS `mouvement_traca`', [])
                                        .then(() => {
                                            console.log('table mouvement traca deleted !');
                                            this.db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement_traca` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `ref_article` INTEGER, `date` VARCHAR(255), `ref_emplacement` VARCHAR(255), `type` VARCHAR(255), `operateur` VARCHAR(255))', [])
                                                .then(() => {
                                                    console.log('table mouvement traca créée !')
                                                    this.db.executeSql('CREATE TABLE IF NOT EXISTS `API_PARAMS` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `url` TEXT)', []).then(() => {
                                                        console.log('table api_params créée!');
                                                        this.db.executeSql('INSERT INTO `API_PARAMS` (url) SELECT (\'\') WHERE NOT EXISTS (SELECT * FROM `API_PARAMS`)', []).then(() => {
                                                            console.log('inserted single api param');
                                                            this.db.executeSql('DROP TABLE IF EXISTS `preparation`', []).then(() => {
                                                                this.db.executeSql('CREATE TABLE IF NOT EXISTS `preparation` (`id` INTEGER PRIMARY KEY, `numero` TEXT, `emplacement` TEXT, `date_end` TEXT, `started` INTEGER)', []).then(() => {
                                                                    console.log('table prepa créee');
                                                                    this.db.executeSql('DROP TABLE IF EXISTS `article_prepa`', []).then(() => {
                                                                        this.db.executeSql('CREATE TABLE IF NOT EXISTS `article_prepa` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `label` TEXT, `reference` TEXT, `quantite` INTEGER, `is_ref` TEXT, `id_prepa` INTEGER, `has_moved` INTEGER, `emplacement` TEXT)', []).then(() => {
                                                                            console.log('table article prepa crée');
                                                                        }).catch(err => console.log(err));
                                                                    });
                                                                }).catch(err => console.log(err));
                                                            });
                                                        }).catch(err => console.log(err));
                                                    })
                                                })
                                                .catch(e => console.log(e));

                                        })
                                        .catch(e => console.log(e));
                                })
                                .catch(e => console.log(e));
                        });
                    });
            });
    }

    public cleanDataBase(fromAfter = false): Promise<any> {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('DELETE FROM `article`;', [])
                .then(() => {
                    this.db.executeSql('DELETE FROM `emplacement`;', [])
                        .then(() => {
                            this.db.executeSql('DELETE FROM `mouvement_traca`;', [])
                                .then(() => {
                                    if (!fromAfter) {
                                        this.db.executeSql('DELETE FROM `preparation`;', [])
                                            .then(() => {
                                                resolve(this.db.executeSql('DELETE FROM `article_prepa`;', [])
                                                    .then(() => {
                                                        console.log('Tables cleansed');
                                                    }).catch(err => {
                                                        console.log(err);
                                                    }));
                                            }).catch(err => {
                                            console.log(err);
                                        });
                                    }
                                }).catch(err => {
                                console.log(err);
                            })
                        }).catch(err => {
                        console.log(err);
                    }).catch(err => {
                        console.log(err);
                    });
                });
        });
        return resp;
    }

    public setOperateur(operateur) {
        this.storageService.setOperateur(operateur);
    }

    public getOperateur() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.getOperateur().then((value) => {
                resolve(value);
            });
        });
    }

    public async importData(data, refresh = false) {

        return new Promise<any>((resolve) => {
            let promisePreps = new Promise<any>((resolvePrepsStorage) => {
                if (!refresh) {
                    this.storageService.setApiKey(data['apiKey']);
                    this.storageService.setPreps().then(() => {
                        resolvePrepsStorage();
                    })
                } else {
                    resolvePrepsStorage();
                }
            });
            promisePreps.then(() => {
                let articles = data['articles'];
                let articleValues = [];
                for (let article of articles) {
                    articleValues.push("(" + null + ", '" + article.reference + "', " + (article.quantiteStock || article.quantiteStock === 0 ? article.quantiteStock : article.quantite) + ")");
                }
                let articleValuesStr = articleValues.join(', ');
                let sqlArticles = 'INSERT INTO `article` (`id`, `reference`, `quantite`) VALUES ' + articleValuesStr + ';';
                console.log(sqlArticles);


                let emplacements = data['emplacements'];
                let emplacementValues = [];
                for (let emplacement of emplacements) {
                    emplacementValues.push("(" + emplacement.id + ", '" + emplacement.label.replace(/(\"|\')/g, "\'$1") + "')");
                }
                let emplacementValuesStr = emplacementValues.join(', ');
                let sqlEmplacements = 'INSERT INTO `emplacement` (`id`, `label`) VALUES ' + emplacementValuesStr + ';';

                let prepas = data['preparations'];
                let prepasValues = [];
                let promisePrepas = new Promise<any>((resolvePreps) => {
                    if (prepas.length === 0) resolvePreps();
                    for (let prepa of prepas) {
                        this.findOne('preparation', prepa.id).then((prepaInserted) => {
                            console.log(prepaInserted);
                            if (prepaInserted === null) {
                                prepasValues.push("(" + prepa.id + ", '" + prepa.number + "', " + null + ", " + null + ", 0)");
                            }
                            if (prepas.indexOf(prepa) === prepas.length - 1) {
                                this.findAll('`preparation`').then((preparations) => {
                                    if (preparations.length === 0) {
                                        console.log('resolved');
                                        resolvePreps();
                                    } else {
                                        this.deletePreparations(preparations.filter(p => prepas.find(prep => prep.id === p.id) === undefined)).then(() => {
                                            console.log("gfdgfdYESSS");
                                            resolvePreps();
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
                promisePrepas.then(() => {
                    let prepasValuesStr = prepasValues.join(', ');
                    let sqlPrepas = 'INSERT INTO `preparation` (`id`, `numero`, `emplacement`, `date_end`, `started`) VALUES ' + prepasValuesStr + ';';
                    let articlesPrepa = data['articlesPrepa'];
                    let articlesPrepaValues = [];
                    let promiseAP = new Promise<any>((resolveAP) => {
                        console.log(articlesPrepa);
                        if (articlesPrepa.length === 0) resolveAP();
                        for (let article of articlesPrepa) {
                            console.log('bdghfdsalt');
                            this.findArticlesByPrepa(article.id_prepa).then((articles) => {
                                console.log(articles);
                                if (articles.find(articlePrepa => articlePrepa.reference === article.reference && articlePrepa.is_ref === article.is_ref) === undefined) {
                                    articlesPrepaValues.push("(" + null + ", '" + article.label + "', '" + article.reference + "', " + article.quantity + ", '" + article.is_ref + "', " + article.id_prepa + ", " + 0 + ", '" + article.location + "')");
                                }
                                if (articlesPrepa.indexOf(article) === articlesPrepa.length - 1) resolveAP()
                            });
                        }
                    });
                    promiseAP.then(() => {
                        let articlesPrepaValuesStr = articlesPrepaValues.join(', ');
                        let sqlArticlesPrepa = 'INSERT INTO `article_prepa` (`id`, `label`, `reference`, `quantite`, `is_ref`, `id_prepa`, `has_moved`, `emplacement`) VALUES ' + articlesPrepaValuesStr + ';';
                        this.db.executeSql(sqlArticles, [])
                            .then(val => val).catch((err) => console.log(err)).then(() => {
                            this.db.executeSql(sqlEmplacements, [])
                                .then(val => val).catch((err) => console.log(err)).then(() => {
                                this.db.executeSql(sqlPrepas, [])
                                    .then(val => val).catch((err) => console.log(err)).then(() => {
                                    resolve(this.db.executeSql(sqlArticlesPrepa, [])
                                        .then(val => val).catch((err) => console.log(err)).then(() => {
                                            console.log('Inserted data');
                                        }));
                                });
                            });
                        });
                    });
                });
            })
        })

    }

    static openDatabase() {
        let resp = new Promise<SQLiteObject>(function (resolve) {
            if (this.db == null) {
                this.createDbFile();
            } else {
                resolve(this.db);
            }
        });
        return resp;
    }

    public findOne(table: string, id: number): Promise<any> {
        let query: string = "SELECT * FROM " + table + " WHERE id = ? ";

        let resp = new Promise<any>((resolve) => {
            this.db.executeSql(query, [id]).then((data) => {
                let object = null;
                if (data.rows.length > 0) {
                    object = data.rows.item(0);
                }
                resolve(object);
            });
        });
        return resp;
    }

    public count(table: string, where?: any[]): Promise<any> {
        let query = "SELECT COUNT(*) AS nb FROM " + table;

        let values = [];
        if (where) {
            let res = this.buildQueryWhereClause(where);
            query += res.query;
            values = res.values;
        }

        let resp = new Promise<any>((resolve) => {
            this.db.executeSql(query, values).then((data) => {
                let count = 0;
                if (data.rows.length > 0) {
                    let item = data.rows.item(0);
                    count = item.nb;
                }
                resolve(count);
            });
        });
        return resp;
    }

    public findAll(table: string) {
        let list = [];
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('SELECT * FROM ' + table, [])
                .then((data) => {

                    if (data == null) {
                        return;
                    }

                    if (data.rows) {
                        if (data.rows.length > 0) {
                            for (let i = 0; i < data.rows.length; i++) {
                                list.push(data.rows.item(i));
                            }
                        }
                    }
                    resolve(list);
                });
        });
        return resp;
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

    public findByElementNull(table: string, element: string) {
        let list = [];
        this.db.executeSql('SELECT * FROM ' + table + 'WHERE ' + element + ' IS NULL', [])
            .then((data) => {

                if (data == null) {
                    return;
                }

                if (data.rows) {
                    if (data.rows.length > 0) {
                        for (let i = 0; i < data.rows.length; i++) {
                            list.push(data.rows.item(i));
                        }
                    }
                }
            });
        return list;
    }

    public findByElement(table: string, element: string, value: string) {
        if (value !== '') {
            let list = [];
            let query = 'SELECT * FROM ' + table + ' WHERE ' + element + ' LIKE \'%' + value + '%\'';
            console.log(query);
            this.db.executeSql(query, [])
                .then((data) => {

                    if (data == null) {
                        return;
                    }

                    if (data.rows) {
                        if (data.rows.length > 0) {
                            for (let i = 0; i < data.rows.length; i++) {
                                list.push(data.rows.item(i));
                            }
                        }
                    }
                }).catch(err => console.log(err));
            return list;
        }
    }

    public insert(name: string, object: any) {
        let values = [];
        let query = "INSERT INTO " + name + " VALUES (";
        Object.keys(object).forEach((key) => {
            values.push(object[key]);
            query += '?, '
        });
        query = query.slice(0, -2) + ");";
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql(query, values).then((id) => {
                resolve(id);
            }).catch(err => console.log(err));
        });
        return resp;
    }

    public executeQuery(query: string) {
        console.log(query);
        return this.db.executeSql(query).then(() => console.log("fsd")).catch(err => console.log(err));
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

    public async setAPI_URL(url) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('UPDATE `API_PARAMS` SET url = \'' + url + '\'', []).then(() => {
                resolve(true);
            }).catch((err) => {
                resolve(err);
            })
        });
        return resp;
    }

    public getAPI_URL() {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('SELECT * FROM `API_PARAMS` LIMIT 1', []).then((data) => {
                if (data && data.rows && data.rows.length > 0 && data.rows.item(0).url !== '') {
                    resolve(data.rows.item(0).url);
                } else {
                    resolve(null);
                }
            }).catch((err) => {
                console.log(err);
                resolve(false);
            })
        });
        return resp;
    }

    public getApiKey() {
        return new Promise<any>((resolve, reject) => {
            this.storageService.getApiKey().then((value) => {
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

    public findArticlesByPrepa(id_prepa: number) {
        let list = [];
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('SELECT * FROM `article_prepa` WHERE `id_prepa` = ' + id_prepa, []).then((articles) => {
                if (articles == null) {
                    return;
                }

                if (articles.rows) {
                    if (articles.rows.length > 0) {
                        for (let i = 0; i < articles.rows.length; i++) {
                            list.push(articles.rows.item(i));
                        }
                    }
                }
                resolve(list);
            }).catch(err => console.log(err));
        });
        return resp;
    }

    public findMvtByArticle(id_art: number) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('SELECT * FROM `mouvement` WHERE `id_article_prepa` = ' + id_art + ' LIMIT 1', []).then((mvt) => {
                if (mvt && mvt.rows && mvt.rows.length > 0 && mvt.rows.item(0).url !== '') {
                    resolve(mvt.rows.item(0));
                } else {
                    resolve(null);
                }
            }).catch(err => console.log(err));
        });
        return resp;
    }

    public finishPrepa(id_prepa: number, emplacement) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('UPDATE `preparation` SET date_end = \'' + moment().format() + '\', emplacement = \'' + emplacement + '\' WHERE id = ' + id_prepa, []).then(() => {
                resolve();
            })
        });
        return resp;
    }

    public finishMvt(id_mvt: number, location_to: string) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('UPDATE `mouvement` SET date_drop = \'' + moment().format() + '\', location_to = \'' + location_to + '\' WHERE id = ' + id_mvt, []).then(() => {
                resolve();
            })
        });
        return resp;
    }

    public moveArticle(id_article: number) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('UPDATE `article_prepa` SET has_moved = 1 WHERE id = ' + id_article, []).then(() => {
                resolve();
            }).catch(err => console.log(err));
        });
        return resp;
    }

    public updateArticleQuantity(id_article: number, quantite: number) {
        let resp = new Promise<any>((resolve) => {
            this.db.executeSql('UPDATE `article_prepa` SET quantite = ' + quantite + ' WHERE id = ' + id_article, []).then(() => {
                resolve();
            }).catch(err => console.log(err));
        });
        return resp;
    }

    public deletePreparations(preparations: Array<Preparation>) {
        let resp = new Promise<any>((resolve) => {
            if (preparations.length === 0) {
                console.log('"gfdgdfgd');
                resolve();
            } else {
                console.log('"gfdgdfgd');
                preparations.forEach(preparation => {
                    this.db.executeSql('DELETE FROM `preparation` WHERE id = ' + preparation.id, []).then(() => {
                        if (preparations.indexOf(preparation) === preparations.length - 1) resolve();
                    }).catch(err => console.log(err));
                });
            }
        });
        return resp;
    }

    public deleteMvts(mvts: Array<Mouvement>) {
        let resp = new Promise<any>((resolve) => {
            mvts.forEach(mouvement => {
                this.db.executeSql('DELETE FROM `mouvement` WHERE id = ' + mouvement.id, []).then(() => {
                    if (mvts.indexOf(mouvement) === mvts.length - 1) resolve();
                }).catch(err => console.log(err));
            });
        });
        return resp;
    }

}
