import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Observable, Subscription} from 'rxjs';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {BarcodeScannerComponent} from "@helpers/components/barcode-scanner/barcode-scanner.component";
import {MouvementTraca} from "@app/entities/mouvement-traca";
import {HeaderConfig} from "@helpers/components/panel/model/header-config";
import {ListPanelItemConfig} from "@helpers/components/panel/model/list-panel/list-panel-item-config";
import {TracaListFactoryService} from "@app/services/traca-list-factory.service";
import moment from 'moment';
import {DeposeConfirmPageTraca} from "@pages/traca/depose-confirm/depose-confirm-traca";


@IonicPage()
@Component({
    selector: 'page-depose-articles',
    templateUrl: 'depose-articles-traca.html',
})
export class DeposeArticlesPageTraca {

    private static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;
    public colisDepose: Array<MouvementTraca>;

    private zebraScanSubscription: Subscription;

    private finishDepose: () => void;

    public priseListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public deposeListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues: Array<string>;

    public loading: boolean;

    private operator: string;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private localDataManager: LocalDataManagerService,
                       private tracaListFactory: TracaListFactoryService,
                       private storageService: StorageService) {
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
        if (!this.operator) {
            this.init();
            this.emplacement = this.navParams.get('emplacement');
            this.finishDepose = this.navParams.get('finishDepose');
            Observable
                .zip(
                    this.sqliteProvider.findByElement('`mouvement_traca`', 'type', 'prise'),
                    this.storageService.getOperateur()
                )
                .subscribe(([colisPrise, operator]) => {
                    this.colisPrise = colisPrise;
                    this.operator = operator;

                    this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
                        this.testColisDepose(barcode);
                    });

                    this.refreshPriseListComponent();
                    this.loading = false;
                });
        }
    }

    public ionViewWillLeave(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return !this.footerScannerComponent.isScanning;
    }

    public finishTaking(): void {
        if (this.colisDepose && this.colisDepose.length > 0) {
            this.localDataManager
                .saveMouvementsTraca(this.colisDepose, DeposeArticlesPageTraca.MOUVEMENT_TRACA_DEPOSE)
                .subscribe(() => {
                    this.redirectAfterTake();
                });
        }
        else {
            this.toastService.presentToast('Vous devez sélectionner au moins un article')
        }
    }

    public redirectAfterTake(): void {
        this.navCtrl
            .pop()
            .then(() => {
                this.finishDepose();
                this.toastService.presentToast('Dépose enregistrée.')
            });
    }

    public testColisDepose(barCode: string, isManualInput: boolean = false): void {
        let numberOfColis = this.colisDepose
            .filter(article => (article.ref_article === barCode))
            .length;

        this.storageService.keyExists(barCode).subscribe((value) => {
            if (value !== false) {
                if (value > numberOfColis) {
                    if (isManualInput) {
                        this.openConfirmDeposePage(barCode);
                    }
                    else {
                        this.alertController
                            .create({
                                title: `Vous avez sélectionné le colis ${barCode}`,
                                buttons: [
                                    {
                                        text: 'Annuler'
                                    },
                                    {
                                        text: 'Confirmer',
                                        handler: () => {
                                            this.openConfirmDeposePage(barCode);
                                        },
                                        cssClass: 'alertAlert'
                                    }
                                ]
                            })
                            .present();
                    }
                }
                else {
                    this.toastService.presentToast('Ce colis est déjà enregistré assez de fois dans le panier.');
                }
            }
            else {
                this.toastService.presentToast('Ce colis ne correspond à aucune prise.');
            }
        });
    }

    private openConfirmDeposePage(barCode: string): void {
        this.navCtrl.push(DeposeConfirmPageTraca, {
            location: this.emplacement,
            barCode,
            validateDepose: (comment, signature) => {
                this.saveMouvementTraca(barCode, comment, signature);
            }
        });
    }

    private saveMouvementTraca(barCode: string, comment: string, signature: string): void {
        this.colisDepose.push({
            ref_article: barCode,
            comment,
            signature,
            type: DeposeArticlesPageTraca.MOUVEMENT_TRACA_DEPOSE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            date: moment().format()
        });

        this.colisPrise = this.colisPrise.filter(({ref_article}) => (ref_article !== barCode));
        this.refreshPriseListComponent();
        this.refresDeposeListComponent();
    }

    private refreshPriseListComponent(): void {
        this.priseListConfig = this.tracaListFactory.createListConfig(this.colisPrise, this.emplacement, true);

    }

    private refresDeposeListComponent(): void {
        this.deposeListConfig = this.tracaListFactory.createListConfig(this.colisDepose, this.emplacement, false);
    }

    private init(): void {
        this.loading = true;
        this.colisDepose = [];
        this.colisPrise = [];
    }
}
