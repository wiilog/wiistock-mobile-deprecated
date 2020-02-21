import {Component} from '@angular/core';
import {IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {ToastService} from '@app/services/toast.service';
import {EmplacementScanPage} from '@pages/prise-depose/emplacement-scan/emplacement-scan';
import {MenuConfig} from '@helpers/components/menu/menu-config';
import {Network} from "@ionic-native/network";
import {LoadingService} from "@app/services/loading.service";
import {Observable} from "rxjs";


@IonicPage()
@Component({
    selector: 'page-prise-depose-menu',
    templateUrl: 'prise-depose-menu.html',
})
export class PriseDeposeMenuPage {
    public nbDrop: number;

    private fromStock: boolean;
    private canLeave: boolean;

    private deposeAlreadyNavigate: boolean;

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private network: Network,
                       private loadingService: LoadingService,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService) {
        this.nbDrop = 0;
        this.canLeave = true;
        this.deposeAlreadyNavigate = false;

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

    public ionViewCanLeave(): boolean {
        return this.canLeave;
    }

    public ionViewWillEnter(): void {
        this.fromStock = this.navParams.get('fromStock');
        const goToDeposeDirectly = (!this.deposeAlreadyNavigate && this.navParams.get('goToDeposeDirectly'));
        this.canLeave = false;

        Observable
            .zip(
                this.loadingService.presentLoading(),
                this.sqliteProvider.findAll('mouvement_traca')
            )
            .subscribe(([loading, mouvementTraca]: [Loading, Array<MouvementTraca>]) => {
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

                loading.dismissAll();
                this.canLeave = true;

                if (goToDeposeDirectly) {
                    this.deposeAlreadyNavigate = true;
                    this.goToDepose();
                }
            });
    }

    public goToPrise(): void {
        if (!this.fromStock || this.network.type !== 'none') {
            this.navCtrl.push(EmplacementScanPage, {
                fromDepose: false,
                fromStock: this.fromStock
            });
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public goToDepose(): void {
        if (!this.fromStock || this.network.type !== 'none') {
            if (this.canNavigateToDepose) {
                this.navCtrl.push(EmplacementScanPage, {
                    fromDepose: true,
                    fromStock: this.fromStock
                });
            }
            else {
                this.toastService.presentToast('Aucune prise n\'a été enregistrée');
            }
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une dépose');
        }
    }

    private get canNavigateToDepose(): boolean {
        return this.nbDrop > 0;
    }
}
