import {Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {PriseEmplacementPageTraca} from "../prise-emplacement/prise-emplacement-traca";
import {DeposeEmplacementPageTraca} from "../depose-emplacement/depose-emplacement-traca";
import {} from ''
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {MouvementTraca} from "../../../app/entities/mouvementTraca";
import {HttpClient} from "@angular/common/http";


@Component({
    selector: 'page-stockage-menu',
    templateUrl: 'stockage-menu-traca.html',
})
export class StockageMenuPageTraca {
    mvts: MouvementTraca[];
    unfinishedMvts: boolean;

    constructor(public navCtrl: NavController, public navParams: NavParams, sqlProvider: SqliteProvider, public http: HttpClient, public toastController: ToastController) {
        this.mvts = sqlProvider.findAll('`mouvement_traca`');
        sqlProvider.priseAreUnfinished().then((value) => {
            this.unfinishedMvts = value;
        });
    }

    goToPrise() {
        this.navCtrl.push(PriseEmplacementPageTraca);
    }

    goToDepose() {
        this.navCtrl.push(DeposeEmplacementPageTraca); //TODO CG
    }

    goHome() {
        this.navCtrl.push(MenuPage);
    }

    synchronise() {
        if (!this.unfinishedMvts) {
            let baseUrl: string = 'http://51.77.202.108/WiiStock-dev/public/index.php/api/addMouvementTraca';
            let toInsert = {
                mouvements : this.mvts,
            };
            this.http.post<any>(baseUrl, toInsert).subscribe((resp) => {
                if (resp.success) {
                    this.showToast('Export des mouvements effectué.')
                }
            });
        } else {
            this.showToast('Finissez vos mouvements en cours.')
        }
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
