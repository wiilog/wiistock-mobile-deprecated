import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {ToastService} from '@app/services/toast.service';
import {MenuConfig} from '@helpers/components/menu/menu-config';


@IonicPage()
@Component({
    selector: 'page-stock-transfer-menu',
    templateUrl: 'transfer-menu.html',
})
export class TransferMenuPage {
    public nbDrop: number;

    public readonly menuConfig: Array<MenuConfig>;

    public constructor(private sqliteProvider: SqliteProvider,
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
        // TODO AB
    }

    public goToDepose(): void {
        if (this.nbDrop > 0) {
            // TODO AB
        }
        else {
            this.toastService.presentToast('Aucune prise n\'a été enregistrée');
        }
    }
}
