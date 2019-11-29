import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {HttpClient} from '@angular/common/http';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';
import {MenuPage} from '@pages/menu/menu';
import {ApiService} from '@app/services/api.service';
import {StorageService} from '@app/services/storage.service';
import {EmplacementScanPage} from "@pages/traca/emplacement-scan/emplacement-scan";
import {Emplacement} from "@app/entities/emplacement";
import {PriseArticlesPageTraca} from "@pages/traca/prise-articles/prise-articles-traca";
import {DeposeArticlesPageTraca} from "@pages/traca/depose-articles/depose-articles-traca";


@IonicPage()
@Component({
    selector: 'page-traca-menu',
    templateUrl: 'traca-menu.html',
})
export class TracaMenuPage {
    mvts: MouvementTraca[];
    unfinishedMvts: boolean;
    type: string;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider,
                       private http: HttpClient,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private network: Network,
                       private storageService: StorageService) {
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('`mouvement_traca`').subscribe((value) => {
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
        this.navCtrl.push(EmplacementScanPage, {
            fromDepose: false,
            menu: 'Prise',
            chooseEmp: (emplacement: Emplacement) => {
                this.navCtrl.push(PriseArticlesPageTraca, {
                    emplacement: emplacement,
                    finishPrise: () => {
                        this.navCtrl.pop();
                    }
                });
            }
        });
    }

    goToDepose() {
        if (this.unfinishedMvts) {
            this.navCtrl.push(EmplacementScanPage, {
                fromDepose: true,
                menu: 'Dépose',
                chooseEmp: (emplacement: Emplacement) => {
                    this.navCtrl.push(DeposeArticlesPageTraca, {
                        emplacement: emplacement,
                        finishDepose: () => {
                            this.navCtrl.pop();
                        }
                    });
                }
            });
        }
        else {
            this.toastService.presentToast('Aucune prise n\'a été enregistrée');
        }
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    synchronise() {
        this.apiService.getApiUrl(ApiService.ADD_MOUVEMENT_TRACA).subscribe((addMouvementTracaUrl) => {
            this.sqliteProvider.findAll('`mouvement_traca`').subscribe((data) => {
                this.storageService.getApiKey().subscribe((result) => {
                    let toInsert = {
                        mouvements: data,
                        apiKey: result
                    };
                    this.http.post<any>(addMouvementTracaUrl, toInsert).subscribe((resp) => {
                        if (resp.success) {
                            this.sqliteProvider.cleanTable('`mouvement_traca`').subscribe(() => {
                                this.toastService.presentToast(resp.data.status);
                            });
                        }
                    });
                });
            });
        });
    }
}
