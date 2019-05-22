// import { NavController, NavParams } from 'ionic-angular';
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import { Injectable } from '@angular/core';
import { StorageService } from "../../app/services/storage.service";

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
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `article` (`id` INTEGER PRIMARY KEY, `label` VARCHAR(255), `reference` VARCHAR(255), `quantite` INTEGER)', [])
            .then(() => {
                console.log('table article créée');

                this.db.executeSql('CREATE TABLE IF NOT EXISTS `emplacement` (`id` INTEGER PRIMARY KEY, `label` VARCHAR(255))', [])
                    .then(() => {
                        console.log('table emplacement créée !')
                        this.db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `id_article` INTEGER, `quantite` INTEGER, `date_prise` VARCHAR(255), `id_emplacement_prise` INTEGER, `date_depose` VARCHAR(255), `id_emplacement_depose` INTEGER)', [])
                            .then(() => console.log('table mouvement créée !'))
                            .catch(e => console.log(e));
                    });
            });
    }

    public cleanDataBase(): Promise<any> {
        return this.db.executeSql('DELETE FROM `article`;', [])
            .then(() => {
                this.db.executeSql('DELETE FROM `emplacement`;', [])
                    .then(() => {
                        console.log('Tables cleansed');
                    }).catch(err => {
                        console.log(err);
                    })
            }).catch(err => {
                console.log(err);
            });
    }

    public async importData(data) {
        this.storageService.setApiKey(data['apiKey']);

        let articles = data['articles'];
        let articleValues = [];
        for (let article of articles) {
            articleValues.push("(" + article.id + ", '" + article.reference + "', " + (article.quantiteStock ? article.quantiteStock : article.quantite) + ")");
        }
        let articleValuesStr = articleValues.join(', ');
        let sqlArticles = 'INSERT INTO `article` (`id`, `reference`, `quantite`) VALUES ' + articleValuesStr + ';';
        console.log(sqlArticles);
        let emplacements = data['emplacements'];
        let emplacementValues = [];
        for (let emplacement of emplacements) {
            emplacementValues.push("(" + emplacement.id + ", '" + emplacement.label + "')");
        }
        let emplacementValuesStr = emplacementValues.join(', ');
        let sqlEmplacements = 'INSERT INTO `emplacement` (`id`, `label`) VALUES ' + emplacementValuesStr + ';';
        console.log(sqlEmplacements);
        return this.db.executeSql(sqlArticles, [])
            .then(() => {
                return this.db.executeSql(sqlEmplacements, [])
                    .catch(e => console.log(e));
            }).catch(e => console.log(e));

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
            });
        return list;
    }

    public insert(name: string, object: any) {
        console.log(object);
        let fields = Object.keys(object);
        let values = Object.keys(object).map((key) => {
            return object[key];
        });

        let query = "INSERT INTO " + name + " (";

        let i = 0;
        for (let field of fields) {
            query += field;
            if (i < fields.length - 1) {
                query += ", ";
            }
            i++;
        }
        query += " ) VALUES ( ";

        let nbValues = values.length;
        // for (i = 0; i < nbValues; i++) {
        //     query += " ? ";
        //     if (i < nbValues - 1) {
        //         query += ", ";
        //     }
        // }
        for (i = 0; i < nbValues; i++) {
            query += "'" + values[i] + "'";
            if (i < nbValues - 1) {
                query += ", ";
            }
        }

        query += " );";
        console.log(query);

        return this.db.executeSql(query);
        // return this.db.executeSql(query, values);
    }

    public executeQuery(query: string) {
        return this.db.executeSql(query);
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

        return { query: query, values: values };
    }
}
