import {Component} from '@angular/core';
import {Events, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {PriseEmplacementPageTraca} from "../prise-emplacement/prise-emplacement-traca";
import {DeposeEmplacementPageTraca} from "../depose-emplacement/depose-emplacement-traca";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {MouvementTraca} from "../../../app/entities/mouvementTraca";
import {HttpClient} from "@angular/common/http";
import {NetworkProvider} from "../../../providers/network/network";
import {Network} from "@ionic-native/network";


@Component({
    selector: 'page-stockage-menu',
    templateUrl: 'stockage-menu-traca.html',
})
export class StockageMenuPageTraca {
    mvts: MouvementTraca[];
    unfinishedMvts: boolean;
    type: string;
    sqlProvider : SqliteProvider;
    addMvtURL : string = '/api/addMouvementTraca';

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                sqlProvider: SqliteProvider,
                public http: HttpClient,
                public toastController: ToastController,
                public networkProvider: NetworkProvider,
                public events: Events,
                public network: Network,) {
        this.sqlProvider = sqlProvider;
        this.sqlProvider.findAll('`mouvement_traca`').then((value) => {
            this.mvts = value;
        });
        this.sqlProvider.priseAreUnfinished().then((value) => {
            this.unfinishedMvts = value;
            this.type = this.network.type;
            if(this.type !== "unknown" && this.type !== "none" && this.type !== undefined){
                this.synchronise();
            }
        });
    }

    goToPrise() {
        this.navCtrl.push(PriseEmplacementPageTraca);
    }

    goToDepose() {
        this.navCtrl.push(DeposeEmplacementPageTraca); //TODO CG
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    synchronise() {
        this.sqlProvider.getAPI_URL().then((resultUrl) => {
            if (resultUrl !== null) {
                let url: string = resultUrl + this.addMvtURL;
                this.sqlProvider.findAll('`mouvement_traca`').then((data) => {
                    this.sqlProvider.getApiKey().then(result => {
                        let toInsert = {
                            mouvements: data,
                            apiKey: result
                    };
                        this.http.post<any>(url, toInsert).subscribe((resp) => {
                            if (resp.success) {
                                this.showToast(resp.data.status);
                            }
                        });
                    });
                });
            } else {
                this.showToast('Aucune configuration URL...')
            }
        });
    }


    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }


}
