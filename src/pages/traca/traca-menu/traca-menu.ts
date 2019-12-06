import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {ToastService} from '@app/services/toast.service';
import {EmplacementScanPage} from "@pages/traca/emplacement-scan/emplacement-scan";
import {Emplacement} from '@app/entities/emplacement';
import {PriseArticlesPageTraca} from '@pages/traca/prise-articles/prise-articles-traca';
import {DeposeArticlesPageTraca} from '@pages/traca/depose-articles/depose-articles-traca';


@IonicPage()
@Component({
    selector: 'page-traca-menu',
    templateUrl: 'traca-menu.html',
})
export class TracaMenuPage {
    public unfinishedMvts: boolean;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('mouvement_traca').subscribe((mouvementTraca: Array<MouvementTraca>) => {
            this.unfinishedMvts = mouvementTraca.some(({finished, type}) => (type === 'prise' && !finished));
        });
    }

    public goToPrise(): void {
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

    public goToDepose(): void {
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
}
