import {Component} from '@angular/core';
import {Alert, AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Observable, Subscription} from 'rxjs';
import {AlertManagerService} from '@app/services/alert-manager.service';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {TracaListFactoryService} from '@app/services/traca-list-factory.service';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {DeposeConfirmPageTraca} from '@pages/traca/depose-confirm/depose-confirm-traca';


@IonicPage()
@Component({
    selector: 'page-depose-articles',
    templateUrl: 'depose-articles-traca.html',
})
export class DeposeArticlesPageTraca {

    private static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;
    public colisDepose: Array<MouvementTraca>;

    private zebraScanSubscription: Subscription;
    private finishDepose: () => void;

    private manualEntryAlertWillEnterSubscription: Subscription;

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
                       private alertManager: AlertManagerService,
                       private localDataManager: LocalDataManagerService,
                       private tracaListFactory: TracaListFactoryService,
                       private storageService: StorageService) {
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
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

    public ionViewWillLeave(): void {
        this.removeAlertSubscription();
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public addArticleManually(): void {
        this.createManualEntryAlert().present();
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
        this.navCtrl.pop()
            .then(() => {
                this.finishDepose();
                this.toastService.presentToast('Dépose enregistrée.')
            });
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode: string) => {
            this.testColisDepose(barcode);
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

    private createManualEntryAlert(): Alert {
        const manualEntryAlert = this.alertController.create({
            title: 'Saisie manuelle',
            cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
            inputs: [{
                name: 'barCode',
                placeholder: 'Saisir le code barre',
                type: 'text'
            }],
            buttons: [{
                text: 'Valider',
                handler: ({barCode}) => {
                    this.testColisDepose(barCode);
                },
                cssClass: 'alertAlert'
            }]
        });

        this.removeAlertSubscription();
        this.manualEntryAlertWillEnterSubscription = manualEntryAlert.willEnter.subscribe(() => {
            this.alertManager.disableAutocapitalizeOnAlert();
        });

        return manualEntryAlert;
    }

    private removeAlertSubscription(): void {
        if (this.manualEntryAlertWillEnterSubscription) {
            this.manualEntryAlertWillEnterSubscription.unsubscribe();
            this.manualEntryAlertWillEnterSubscription = undefined;
        }
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
            ref_emplacement: this.emplacement.label
        });

        this.colisPrise = this.colisPrise.filter(({ref_article}) => (ref_article !== barCode));

        this.refreshPriseListComponent();
        this.refresDeposeListComponent();
    }

    private refreshPriseListComponent(): void {
        this.priseListConfig = this.tracaListFactory.createListPriseConfig(this.colisPrise, this.emplacement);
    }

    private refresDeposeListComponent(): void {
        this.deposeListConfig = this.tracaListFactory.createListPriseConfig(this.colisDepose, this.emplacement);
    }

    private init(): void {
        this.loading = true;
        this.colisDepose = [];
        this.colisPrise = [];
    }
}
