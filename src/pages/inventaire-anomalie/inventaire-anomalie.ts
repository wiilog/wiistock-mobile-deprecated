import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ArticleInventaire} from "../../app/entities/articleInventaire";
import {Anomalie} from "../../app/entities/anomalie";

/**
 * Generated class for the InventaireAnomaliePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-inventaire-anomalie',
    templateUrl: 'inventaire-anomalie.html',
})
export class InventaireAnomaliePage {
    anomalies: Array<Anomalie>;
    dataApi: string = '/api/getAnomalies';

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public http: HttpClient,
    ) {}

    ionViewDidLoad() {
        console.log('ionViewDidLoad InventaireAnomaliePage');
    }

    ionViewDidEnter() {
        this.importAnomaliesData();
    }

    importAnomaliesData() {
        // this.sqlLiteProvider.getAPI_URL().then((result) => {
        //     if (result !== null) {
        //         let url: string = result + this.dataApi;
        //         this.sqlLiteProvider.getApiKey().then((key) => {
        //             this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
        //                 if (resp.success) {
        //                     this.sqlLiteProvider.cleanTable('`anomalie_inventaire`').then(() => {
        //                         this.sqlLiteProvider.importAnomaliesInventaire(resp).then((sqlAnomaliesInventaire) => {
        //                             if (sqlAnomaliesInventaire !== false) {
        //                                 this.sqlLiteProvider.executeQuery(sqlAnomaliesInventaire).then(() => {
        //                                     console.log('Imported articles inventaire');
        //                                 });
        //                             }
        //                         }).then(() => {
        //                             this.sqlLiteProvider.findAll('`anomalie_inventaire`').then(anomalies => {
        //                                 this.anomalies = anomalies;
        //                                 setTimeout(() => {
        //                                     this.hasLoaded = true;
        //                                     this.content.resize();
        //                                 }, 1000);
        //                             });
        //                         });
        //                         this.addInventoryEntries();
        //                     });
        //                 } else {
        //                     this.hasLoaded = true;
        //                     this.showToast('Une erreur est survenue.');
        //                 }
        //             }, error => {
        //                 this.hasLoaded = true;
        //                 this.showToast('Une erreur réseau est survenue.');
        //             });
        //         });
        //     } else {
        //         this.showToast('Veuillez configurer votre URL dans les paramètres.')
        //     }
        // }).catch(err => console.log(err));
    }
}
