// import { NavController, NavParams } from 'ionic-angular';
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import { Injectable } from '@angular/core';

const DB_NAME: string = 'follow_gt.db';

@Injectable()
export class SqliteProvider {

    private db: SQLiteObject = null;


    constructor(private sqlite: SQLite) {
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
        this.db.executeSql('CREATE TABLE IF NOT EXISTS `article` (`id` INTEGER PRIMARY KEY AUTOINCREMENT , `reference` VARCHAR(255), `quantite` INTEGER)', [])
            .then(() => {
                console.log('table article créée');

                this.db.executeSql('CREATE TABLE IF NOT EXISTS `emplacement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT , `nom` VARCHAR(255))', [])
                    .then(() => {
                        console.log('table emplacement créée !')

                        this.db.executeSql('CREATE TABLE IF NOT EXISTS `mouvement` (`id` INTEGER PRIMARY KEY AUTOINCREMENT , `type` VARCHAR(16), `date` VARCHAR(255), `username` VARCHAR(255), `id_emplacement` INTEGER)', [])
                            .then(() => console.log('table mouvement créée'))

                            this.db.executeSql('CREATE TABLE IF NOT EXISTS `article_mouvement` (`id_article` INTEGER, `id_mouvement` INTEGER, PRIMARY KEY (`id_article`, `id_mouvement`))', [])
                                .then(() => console.log('table article_mouvement créée !'))
                                .catch(e => console.log(e));
                    });
            });
    }

    public cleanDataBase(): Promise<any> {
        return this.db.executeSql('DELETE FROM `article`', [])
            .then(() => {
                console.log('table article deleted !');
                this.db.executeSql('DELETE FROM `emplacement`', [])
                    .then(() => {
                        console.log('table emplacement cleaned !');
                    });
            });
    }

    public importData(data): Promise<any> {
        return this.db.executeSql('INSERT INTO `emplacement` VALUES (2, \'bat1\'); INSERT INTO `emplacement` VALUES (3, \'bat2\');', [])
            .then(() => {
                this.db.executeSql('INSERT INTO `article` VALUES (2, \'iphoneY\', 3)', []);
                this.db.executeSql('INSERT INTO `article` VALUES (3, \'iphoneZ\', 5)', []);
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

    public count(table:string, where: any[]): Promise<any> {
        let query = "SELECT COUNT(*) AS nb FROM " + table;

        let res = this.buildQueryWhereClause(where);
        query += res.query;
        let values = res.values;

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

                if(data == null) {
                    return;
                }

                if(data.rows) {
                    if(data.rows.length > 0) {
                        for (let i = 0; i < data.rows.length; i++) {
                            list.push(data.rows.item(i));
                        }
                    }
                }
            });
        return list;
    }

    public insert(name: string, object: any) {

        let fields = Object.keys(object);
        let values = Object.keys(object).map((key) => {
            return object[key];
        });

        let query = "INSERT INTO " + name + " (";

        let i = 0;
        for (let field of fields) {
            query += " " + field + " ";
            if (i < fields.length - 1) {
                query += ", ";
            }
            i++;
        }
        query += " ) VALUES( ";

        let nbValues = values.length;
        for (i = 0; i < nbValues; i++) {
            query += " ? ";
            if (i < nbValues - 1) {
                query += ", ";
            }
        }

        query += " );";
        return this.db.executeSql(query, values);
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
