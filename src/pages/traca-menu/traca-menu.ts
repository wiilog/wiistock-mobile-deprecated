import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {ToastService} from '@app/services/toast.service';
import {EmplacementScanPage} from "@pages/prise-depose/emplacement-scan/emplacement-scan";
import {Emplacement} from '@app/entities/emplacement';
import {PrisePage} from '@pages/prise-depose/prise-articles/prise';
import {DeposeArticlesPageTraca} from '@pages/prise-depose/depose-articles/depose-articles-traca';
import {MenuConfig} from "@helpers/components/menu/menu-config";


@IonicPage()
@Component({
    selector: 'page-traca-menu',
    templateUrl: 'traca-menu.html',
})
export class TracaMenuPage {
    public nbDrop: number;

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService) {
        this.nbDrop = 0;

        this.menuConfig = [
            {
                icon: 'upload.svg',
                label: 'Prise',
                action: () => this.goToPrise()
            },
            {
                icon: 'download.svg',
                label: 'Dépose',
                action: () => this.goToDepose()
            }
        ];
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('mouvement_traca').subscribe((mouvementTraca: Array<MouvementTraca>) => {
            this.nbDrop = mouvementTraca
                .filter(({finished, type}) => (type === 'prise' && !finished))
                .length;
        });
    }

    public goToPrise(): void {
        this.navCtrl.push(EmplacementScanPage, {
            fromDepose: false,
            menu: 'Prise',
            chooseEmp: (emplacement: Emplacement) => {
                this.navCtrl.push(PrisePage, {
                    emplacement: emplacement,
                    finishPrise: () => {
                        this.navCtrl.pop();
                    }
                });
            }
        });
    }

    public goToDepose(): void {
        if (this.nbDrop > 0) {
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
