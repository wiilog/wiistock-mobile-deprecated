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
import {DeposeConfirmPage} from "@pages/prise-depose/depose-confirm/depose-confirm";
import {flatMap, map} from "rxjs/operators";
import {of} from "rxjs/observable/of";
import {Network} from "@ionic-native/network";


@IonicPage()
@Component({
    selector: 'page-depose',
    templateUrl: 'depose.html',
})
export class DeposePage {

    private static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;
    public colisDepose: Array<MouvementTraca>;
    public prisesToFinish: Array<number>;

    private fromStock: boolean;

    private zebraScanSubscription: Subscription;

    private finishDepose: () => void;

    private apiLoading: boolean;

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

    public constructor(private navCtrl: NavController,
                       private network: Network,
                       private navParams: NavParams,
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
            this.fromStock = this.navParams.get('fromStock');
            Observable
                .zip(
                    this.sqliteProvider.findBy(
                        'mouvement_traca',
                        [
                            `type LIKE 'prise'`,
                            `finished = 0`,
                            `fromStock = ${Number(this.fromStock)}`
                        ]
                    ),
                    this.storageService.getOperateur()
                )
                .subscribe(([colisPrise, operator]) => {
                    this.colisPrise = colisPrise;
                    this.operator = operator;

                    this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
                        this.testColisDepose(barcode);
                    });

                    this.refresDeposeListComponent();
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
            if(!this.apiLoading) {
                this.apiLoading = true;
                const multiDepose = (this.colisDepose.length > 1);
                this.localDataManager
                    .saveMouvementsTraca(this.colisDepose, this.prisesToFinish)
                    .pipe(
                        flatMap(() => {
                            const online = (this.network.type !== 'none');
                            return online
                                ? this.toastService
                                    .presentToast(multiDepose ? 'Envoi des déposes en cours...' : 'Envoi de la dépose en cours...')
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
                                ? 'Les déposes ont bien été sauvegardées'
                                : (multiDepose
                                    ? 'Déposes sauvegardées localement, nous les enverrons au serveur une fois internet retrouvé'
                                    : 'Dépose sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
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
            this.toastService.presentToast('Vous devez sélectionner au moins un article')
        }
    }

    public redirectAfterTake(): void {
        this.navCtrl
            .pop()
            .then(() => {
                this.finishDepose();
            });
    }

    public testColisDepose(barCode: string, isManualInput: boolean = false): void {
        const priseExists = this.priseExists(barCode);
        if (priseExists) {
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
            this.toastService.presentToast('Ce colis ne correspond à aucune prise.');
        }
    }

    private openConfirmDeposePage(barCode: string): void {
        this.navCtrl.push(DeposeConfirmPage, {
            location: this.emplacement,
            barCode,
            fromStock: this.fromStock,
            validateDepose: (comment, signature) => {
                this.saveMouvementTraca(barCode, comment, signature);
            }
        });
    }

    private saveMouvementTraca(barCode: string, comment: string, signature: string): void {
        const firstPriseMatchingIndex = this.colisPrise.findIndex(({ref_article}) => (ref_article === barCode));
        let quantity;
        if (firstPriseMatchingIndex > -1) {
            quantity = this.colisPrise[firstPriseMatchingIndex].quantity;
            this.prisesToFinish.push(this.colisPrise[firstPriseMatchingIndex].id);
            this.colisPrise.splice(firstPriseMatchingIndex, 1);
        }

        this.colisDepose.push({
            ref_article: barCode,
            comment,
            signature,
            fromStock: Number(this.fromStock),
            quantity,
            type: DeposePage.MOUVEMENT_TRACA_DEPOSE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            date: moment().format()
        });

        this.refreshPriseListComponent();
        this.refresDeposeListComponent();
    }

    private refreshPriseListComponent(): void {
        this.priseListConfig = this.tracaListFactory.createListConfig(this.colisPrise, undefined, true);
    }

    private refresDeposeListComponent(): void {
        this.deposeListConfig = this.tracaListFactory.createListConfig(this.colisDepose, this.emplacement, false, (() => this.finishTaking()));
    }

    private init(): void {
        this.loading = true;
        this.apiLoading = false;
        this.colisDepose = [];
        this.colisPrise = [];
        this.prisesToFinish = [];
    }

    private priseExists(barCode: string): boolean {
        return this.colisPrise.filter(({ref_article}) => (ref_article === barCode)).length > 0;
    }
}
