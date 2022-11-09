import {Component} from '@angular/core';
import {LoadingService} from '@app/common/services/loading.service';
import {ToastService} from '@app/common/services/toast.service';
import {zip} from 'rxjs';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {MouvementTraca} from '@entities/mouvement-traca';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {NavService} from '@app/common/services/nav/nav.service';
import {ActivatedRoute} from '@angular/router';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NetworkService} from '@app/common/services/network.service';


@Component({
    selector: 'wii-stock-movement-menu',
    templateUrl: './stock-movement-menu.page.html',
    styleUrls: ['./stock-movement-menu.page.scss'],
})
export class StockMovementMenuPage extends PageComponent implements CanLeave {

    public nbDrop: number;
    public statsSlidersData: Array<StatsSlidersData>;
    public readonly menuConfig: Array<MenuConfig>;

    private canLeave: boolean;
    private deposeAlreadyNavigate: boolean;

    public constructor(private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.nbDrop = 0;
        this.statsSlidersData = this.createStatsSlidersData(this.nbDrop);
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
                action: () => this.goToDrop()
            }
        ];
    }

    public wiiCanLeave(): boolean {
        return this.canLeave;
    }

    public ionViewWillEnter(): void {
        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.currentNavParams.get('goToDropDirectly')));
        this.canLeave = false;

        zip(
            this.loadingService.presentLoading(),
            this.sqliteService.findAll('mouvement_traca')
        )
            .subscribe(([loading, mouvementTraca]: [HTMLIonLoadingElement, Array<MouvementTraca>]) => {
                this.nbDrop = mouvementTraca
                    .filter(({finished, type, fromStock}) => (
                        type === 'prise' &&
                        !finished &&
                        fromStock
                    ))
                    .length;
console.log(mouvementTraca
    .filter(({finished, type, fromStock}) => (
        type === 'prise' &&
        !finished &&
        fromStock
    )));
                this.statsSlidersData = this.createStatsSlidersData(this.nbDrop);

                loading.dismiss();
                this.canLeave = true;

                if (goToDropDirectly) {
                    this.deposeAlreadyNavigate = true;
                    this.goToDrop();
                }
            });
    }

    public goToPrise(): void {
        if (this.networkService.hasNetwork()) {
            this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                fromDepose: false,
                fromStock: true
            });
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public goToDrop(): void {
        if (this.networkService.hasNetwork()) {
            if (this.canNavigateToDepose) {
                this.navService.push(NavPathEnum.EMPLACEMENT_SCAN, {
                    fromDepose: true,
                    fromStock: true
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

    private createStatsSlidersData(nbDrop: number): Array<StatsSlidersData> {
        const sNbDrop = nbDrop > 1 ? 's' : '';
        return [
            { label: `Produit${sNbDrop} en prise`, counter: nbDrop, danger: nbDrop > 0 }
        ]
    }
}
