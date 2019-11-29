import {Component} from '@angular/core';
import {Alert, AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {ChangeDetectorRef} from '@angular/core';
import {Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {AlertManagerService} from '@app/services/alert-manager.service';
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {HeaderConfig} from "@helpers/components/panel/model/header-config";
import {ListPanelItemConfig} from "@helpers/components/panel/model/list-panel/list-panel-item-config";
import {TracaListFactoryService} from "@app/services/traca-list-factory.service";
import {MouvementTraca} from "@app/entities/mouvement-traca";
import {StorageService} from "@app/services/storage.service";


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

    private static readonly MOUVEMENT_TRACA_PRISE = 'prise';

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;

    private zebraScanSubscription: Subscription;
    private finishPrise: () => void;

    private manualEntryAlertWillEnterSubscription: Subscription;

    public listHeader: HeaderConfig;
    public listBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string>;

    public loading: boolean;

    private operator: string;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private tracaListFactory: TracaListFactoryService,
                       private storageService: StorageService,
                       private alertManager: AlertManagerService) {
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
        this.init();
        this.finishPrise = this.navParams.get('finishPrise');
        this.emplacement = this.navParams.get('emplacement');

        this.storageService.getOperateur().subscribe((operator) => {
            this.operator = operator;

            this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
                this.testIfBarcodeEquals(barcode);
            });

            this.refreshListComponent();
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

    public addColisManually(): void {
        this.createManualEntryAlert().present();
    }

    public finishTaking(): void {
        if (this.colisPrise && this.colisPrise.length > 0) {
            this.localDataManager
                .saveMouvementsTraca(this.colisPrise, PriseArticlesPageTraca.MOUVEMENT_TRACA_PRISE)
                .subscribe(() => {
                    this.redirectAfterTake();
                });
        }
        else {
            this.toastService.presentToast('Vous devez scanner au moins un colis')
        }
    }

    redirectAfterTake() {
        this.navCtrl.pop()
            .then(() => {
                this.finishPrise();
                this.toastService.presentToast('Prise enregistrée.')
            });
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public testIfBarcodeEquals(barCode: string): void {
        if (this.colisPrise && this.colisPrise.some((mouvementTraca) => (mouvementTraca.ref_article === barCode))) {
            this.toastService.presentToast('Ce colis a déjà été ajouté à la prise.');
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
                                this.saveMouvementTraca(barCode);
                            },
                            cssClass : 'alertAlert'
                        }
                    ]
                })
                .present();
        }
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
                    this.saveMouvementTraca(barCode);
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

    private saveMouvementTraca(barCode: string): void {
        this.colisPrise.push({
            ref_article: barCode,
            type: PriseArticlesPageTraca.MOUVEMENT_TRACA_PRISE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label
        });
        this.refreshListComponent();
        this.changeDetectorRef.detectChanges();
    }

    private refreshListComponent(): void {
        const {header, body} = this.tracaListFactory.createListPriseConfig(this.colisPrise, this.emplacement);
        this.listHeader = header;
        this.listBody = body;
    }

    private init(): void {
        this.loading = true;
        this.listBody = [];
        this.colisPrise = [];
    }
}
