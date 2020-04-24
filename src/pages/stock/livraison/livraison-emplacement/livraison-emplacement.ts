import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Livraison} from '@app/entities/livraison';
import {ToastService} from '@app/services/toast.service';
import {Observable} from 'rxjs';
import {flatMap} from 'rxjs/operators';
import 'rxjs/add/observable/zip';
import {of} from 'rxjs/observable/of';
import {Network} from '@ionic-native/network';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {IconConfig} from '@helpers/components/panel/model/icon-config';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {SelectItemComponent} from '@helpers/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@helpers/components/select-item/select-item-type.enum';


@IonicPage()
@Component({
    selector: 'page-livraison-emplacement',
    templateUrl: 'livraison-emplacement.html',
})
export class LivraisonEmplacementPage {
    @ViewChild('selectItemComponent')
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public livraison: Livraison;

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    private validateIsLoading: boolean;
    private validateLivraison: () => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService) {
        this.validateIsLoading = false;
    }

    public ionViewWillEnter(): void {
        this.validateLivraison = this.navParams.get('validateLivraison');
        this.livraison = this.navParams.get('livraison');

        this.panelHeaderConfig = this.createPanelHeaderConfig();

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public ionViewCanLeave(): boolean {
        return !this.selectItemComponent || !this.selectItemComponent.isScanning;
    }


    public selectLocation(locationToTest: Emplacement): void {
        if (this.livraison.emplacement === locationToTest.label) {
            this.location = locationToTest;
            this.panelHeaderConfig = this.createPanelHeaderConfig();
        }
        else {
            this.toastService.presentToast("Vous n'avez pas scanné le bon emplacement (destination demandée : " + this.livraison.emplacement + ")")
        }
    }

    public validate(): void {
        if (!this.validateIsLoading) {
            if (this.location && this.location.label) {
                this.validateIsLoading = true;
                this.sqliteProvider
                    .findArticlesByLivraison(this.livraison.id)
                    .pipe(
                        flatMap((articles) => Observable.zip(
                            ...articles.map((article) => (
                                this.sqliteProvider
                                    .findMvtByArticleLivraison(article.id)
                                    .pipe(flatMap((mvt) => this.sqliteProvider.finishMvt(mvt.id, this.location.label)))
                            ))
                        )),
                        flatMap(() => this.sqliteProvider.finishLivraison(this.livraison.id, this.location.label)),
                        flatMap((): any => (
                            (this.network.type !== 'none')
                                ? this.localDataManager.sendFinishedProcess('livraison')
                                : of({offline: true})
                        ))
                    )
                    .subscribe(
                        ({offline, success}: any) => {
                            if (offline) {
                                this.toastService.presentToast('Livraison sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                this.closeScreen();
                            }
                            else {
                                this.handleLivraisonSuccess(success.length);
                            }
                        },
                        (error) => {
                            this.handleLivraisonError(error);
                        });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
        else {
            this.toastService.presentToast('Chargement en cours...');
        }
    }

    private handleLivraisonSuccess(nbLivraisonsSucceed: number): void {
        if (nbLivraisonsSucceed > 0) {
            this.toastService.presentToast(
                (nbLivraisonsSucceed === 1
                    ? 'Votre livraison a bien été enregistrée'
                    : `Votre livraison et ${nbLivraisonsSucceed - 1} livraison${nbLivraisonsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handleLivraisonError(resp): void {
        this.validateIsLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        if (resp.api) {
            throw resp;
        }
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navCtrl.pop().then(() => {
            this.validateLivraison();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; rightIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'delivery.svg'
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.validate()
            }
        };
    }
}
