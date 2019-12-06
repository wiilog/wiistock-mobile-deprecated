import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {ToastService} from '@app/services/toast.service';
import {EmplacementScanPage} from "@pages/prise-depose/emplacement-scan/emplacement-scan";
import {Emplacement} from '@app/entities/emplacement';
import {PrisePage} from '@pages/prise-depose/prise/prise';
import {DeposePage} from '@pages/prise-depose/depose/depose';
import {MenuConfig} from '@helpers/components/menu/menu-config';
import {Network} from "@ionic-native/network";


@IonicPage()
@Component({
    selector: 'page-prise-depose-menu',
    templateUrl: 'prise-depose-menu.html',
})
export class PriseDeposeMenuPage {
    public nbDrop: number;

    private fromStock: boolean;

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private network: Network,
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
        this.fromStock = this.navParams.get('fromStock');
        this.sqliteProvider.findAll('mouvement_traca').subscribe((mouvementTraca: Array<MouvementTraca>) => {
            this.nbDrop = mouvementTraca
                .filter(({finished, type, fromStock}) => (
                    type === 'prise' &&
                    !finished &&
                    // this.fromStock: boolean & fromStock: number
                    (
                        this.fromStock && fromStock ||
                        !this.fromStock && !fromStock
                    )
                ))
                .length;
        });
    }

    public goToPrise(): void {
        if (this.network.type !== 'none') {
            this.navCtrl.push(EmplacementScanPage, {
                fromDepose: false,
                menu: 'Prise',
                chooseEmp: (emplacement: Emplacement) => {
                    this.navCtrl.push(PrisePage, {
                        emplacement: emplacement,
                        fromStock: this.fromStock,
                        finishPrise: () => {
                            this.navCtrl.pop();
                        }
                    });
                }
            });
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public goToDepose(): void {
        if (this.nbDrop > 0) {
            this.navCtrl.push(EmplacementScanPage, {
                fromDepose: true,
                menu: 'Dépose',
                chooseEmp: (emplacement: Emplacement) => {
                    this.navCtrl.push(DeposePage, {
                        emplacement: emplacement,
                        fromStock: this.fromStock,
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
