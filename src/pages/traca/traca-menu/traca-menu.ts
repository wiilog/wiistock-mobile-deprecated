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
import {ApiServices} from "@app/config/api-services";
import {StorageService} from "@app/services/storage.service";


@IonicPage()
@Component({
    selector: 'page-traca-menu',
    templateUrl: 'traca-menu.html',
})
export class TracaMenuPage {
    mvts: MouvementTraca[];
    unfinishedMvts: boolean;
    type: string;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private sqlProvider: SqliteProvider,
                       private http: HttpClient,
                       private toastService: ToastService,
                       public network: Network,
                       private storageService: StorageService) {
    }

    public ionViewWillEnter(): void {
        this.sqlProvider.findAll('`mouvement_traca`').subscribe((value) => {
            this.mvts = value;
        });
        this.storageService.prisesAreUnfinished().subscribe((value) => {
            this.unfinishedMvts = value;
            this.type = this.network.type;
            if (this.type !== "unknown" && this.type !== "none" && this.type !== undefined) {
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
        this.sqlProvider.getApiUrl(ApiServices.ADD_MOUVEMENT_TRACA).subscribe((addMouvementTracaUrl) => {
            this.sqlProvider.findAll('`mouvement_traca`').subscribe((data) => {
                this.storageService.getApiKey().subscribe(result => {
                    let toInsert = {
                        mouvements: data,
                        apiKey: result
                    };
                    this.http.post<any>(addMouvementTracaUrl, toInsert).subscribe((resp) => {
                        if (resp.success) {
                            this.sqlProvider.cleanTable('`mouvement_traca`').subscribe(() => {
                                this.toastService.showToast(resp.data.status);
                            });
                        }
                    });
                });
            });
        });
    }
}
