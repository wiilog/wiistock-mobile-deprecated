import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {PriseEmplacementPageTraca} from '@pages/traca/prise-emplacement/prise-emplacement-traca';
import {DeposeEmplacementPageTraca} from '@pages/traca/depose-emplacement/depose-emplacement-traca';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {HttpClient} from '@angular/common/http';
import {Network} from '@ionic-native/network';
import {ToastService} from "@app/services/toast.service";
import {MenuPage} from "@pages/menu/menu";


@IonicPage()
@Component({
    selector: 'page-traca-menu',
    templateUrl: 'traca-menu.html',
})
export class TracaMenuPage {
    mvts: MouvementTraca[];
    unfinishedMvts: boolean;
    type: string;
    addMvtURL : string = '/api/addMouvementTraca';

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                private sqlProvider: SqliteProvider,
                private http: HttpClient,
                private toastService: ToastService,
                public network: Network) {
    }

    public ionViewWillEnter(): void {
        this.sqlProvider.findAll('`mouvement_traca`').subscribe((value) => {
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
        if (this.unfinishedMvts) {
            this.navCtrl.push(DeposeEmplacementPageTraca);
        }
        else {
            this.toastService.showToast('Aucune prise n\'a été enregistrée');
        }
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    synchronise() {
        this.sqlProvider.getAPI_URL().subscribe((resultUrl) => {
            if (resultUrl !== null) {
                let url: string = resultUrl + this.addMvtURL;
                this.sqlProvider.findAll('`mouvement_traca`').subscribe((data) => {
                    this.sqlProvider.getApiKey().then(result => {
                        let toInsert = {
                            mouvements: data,
                            apiKey: result
                    };
                        this.http.post<any>(url, toInsert).subscribe((resp) => {
                            if (resp.success) {
                                this.toastService.showToast(resp.data.status);
                            }
                        });
                    });
                });
            } else {
                this.toastService.showToast('Veuillez configurer votre URL dans les paramètres.')
            }
        });
    }
}
