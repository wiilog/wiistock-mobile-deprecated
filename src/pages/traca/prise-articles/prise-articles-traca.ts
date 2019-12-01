import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {ChangeDetectorRef} from '@angular/core';
import {Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {TracaListFactoryService} from '@app/services/traca-list-factory.service';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {StorageService} from '@app/services/storage.service';
import moment from 'moment';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {flatMap, map} from "rxjs/operators";
import {Network} from "@ionic-native/network";
import {of} from "rxjs/observable/of";


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

    private static readonly MOUVEMENT_TRACA_PRISE = 'prise';

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;

    public listHeader: HeaderConfig;
    public listBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string>;

    public loading: boolean;

    private zebraScanSubscription: Subscription;
    private finishPrise: () => void;

    private operator: string;
    private apiLoading: boolean;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private network: Network,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
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
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }


    public ionViewCanLeave(): boolean {
        return !this.footerScannerComponent.isScanning;
    }

    public finishTaking(): void {
        if (this.colisPrise && this.colisPrise.length > 0) {
            const multiPrise = (this.colisPrise.length > 1);
            if (!this.apiLoading) {
                this.apiLoading = true;
                this.localDataManager
                    .saveMouvementsTraca(this.colisPrise)
                    .pipe(
                        flatMap(() => {
                            const online = (this.network.type !== 'none');
                            return online
                                ? this.toastService
                                    .presentToast(multiPrise ? 'Envoi des prises en cours...' : 'Envoi de la prise en cours...')
                                    .pipe(map(() => online))
                                : of(online)
                        }),
                        flatMap((online: boolean) => (
                            online
                                ? this.localDataManager.sendMouvementTraca().pipe(map(() => online))
                                : of(online)
                        )),
                        // we display toast
                        flatMap((send: boolean) => {
                            const message = send
                                ? (multiPrise
                                    ? 'Prises sauvegardées localement, nous les enverrons au serveur une fois internet retrouvé'
                                    : 'Prise sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé')
                                : 'Les prises ont bien été sauvegardées';
                            return this.toastService.presentToast(message);
                        })
                    )
                    .subscribe(
                        () => {
                            this.apiLoading = false;
                            this.redirectAfterTake();
                        },
                        () => {
                            this.apiLoading = false;
                        });
            }
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

    public testIfBarcodeEquals(barCode: string, isManualAdd: boolean = false): void {
        if (this.colisPrise && this.colisPrise.some((colis) => (colis.ref_article === barCode))) {
            this.toastService.presentToast('Cet article a déjà été ajouté à la prise.');
        }
        else {
            if (isManualAdd) {
                this.saveMouvementTraca(barCode);
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
                                cssClass: 'alertAlert'
                            }
                        ]
                    })
                    .present();
            }
        }
    }

    private saveMouvementTraca(barCode: string): void {
        this.colisPrise.push({
            ref_article: barCode,
            type: PriseArticlesPageTraca.MOUVEMENT_TRACA_PRISE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            finished: 0,
            date: moment().format()
        });
        this.refreshListComponent();
        this.changeDetectorRef.detectChanges();
    }

    private refreshListComponent(): void {
        const {header, body} = this.tracaListFactory.createListConfig(this.colisPrise, this.emplacement, true, (() => this.finishTaking()));
        this.listHeader = header;
        this.listBody = body;
    }

    private init(): void {
        this.loading = true;
        this.apiLoading = false;
        this.listBody = [];
        this.colisPrise = [];
    }
}
