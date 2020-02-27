import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
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
import {flatMap, map, tap} from "rxjs/operators";
import {of} from "rxjs/observable/of";
import {Network} from "@ionic-native/network";
import {LoadingService} from "@app/services/loading.service";
import {from} from "rxjs/observable/from";


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
    public colisPrise: Array<MouvementTraca&{hidden?: boolean}>;
    public colisDepose: Array<MouvementTraca>;
    public prisesToFinish: Array<number>;

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

    public fromStock: boolean;

    private zebraScanSubscription: Subscription;
    private saveSubscription: Subscription;

    private finishAction: () => void;

    private apiLoading: boolean;

    private operator: string;

    public constructor(private navCtrl: NavController,
                       private network: Network,
                       private navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
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
            this.finishAction = this.navParams.get('finishAction');
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

                    this.launchZebraScanObserver();

                    this.refreshDeposeListComponent();
                    this.refreshPriseListComponent();
                    this.loading = false;
                });
        }
        else {
            this.launchZebraScanObserver();
        }
    }

    public ionViewWillLeave(): void {
        this.unsubscribeZebraScanObserver();
        if (this.saveSubscription) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
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
                let loader: Loading;
                const online = (this.network.type !== 'none');

                if (!this.fromStock || online) {
                    this.saveSubscription = this.localDataManager
                        .saveMouvementsTraca(this.colisDepose, this.prisesToFinish)
                        .pipe(
                            flatMap(() => {
                                return online
                                    ? this.loadingService
                                        .presentLoading(multiDepose ? 'Envoi des déposes en cours...' : 'Envoi de la dépose en cours...')
                                        .pipe(
                                            tap((presentedLoader: Loading) => {
                                                loader = presentedLoader;
                                            }),
                                            map(() => online)
                                        )
                                    : of(online)
                            }),
                            flatMap((online: boolean): Observable<{ online: boolean; apiResponse?: { [x: string]: any } }> => (
                                online
                                    ? this.localDataManager
                                        .sendMouvementTraca(this.fromStock)
                                        .pipe(
                                            flatMap((apiResponse) => (
                                                loader
                                                    ? from(loader.dismiss()).pipe(map(() => apiResponse))
                                                    : of(apiResponse)
                                            )),
                                            tap(() => {
                                                loader = undefined;
                                            }),
                                            map((apiResponse) => ({ online, apiResponse }))
                                        )
                                    : of({online})
                            )),
                            // we display toast
                            flatMap(({online, apiResponse}) => {
                                const errorsObject = ((apiResponse && apiResponse.data && apiResponse.data.errors) || {});
                                const errorsValues = Object.keys(errorsObject).map((key) => errorsObject[key]);
                                const errorsMessage = errorsValues.join('\n');
                                const message = online
                                    ? (errorsMessage.length > 0 ? '' : apiResponse.data.status)
                                    : (multiDepose
                                        ? 'Déposes sauvegardées localement, nous les enverrons au serveur une fois internet retrouvé'
                                        : 'Dépose sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                return this.toastService
                                    .presentToast(`${errorsMessage}${(errorsMessage && message) ? '\n' : ''}${message}`)
                                    .pipe(map(() => errorsValues.length));
                            })
                        )
                        .subscribe(
                            (nbErrors: number) => {
                                this.apiLoading = false;
                                this.redirectAfterTake(nbErrors > 0);
                            },
                            (error) => {
                                this.apiLoading = false;
                                if (loader) {
                                    loader.dismiss();
                                    loader = undefined;
                                }
                                throw error;
                            });
                }
            }
            else {
                this.toastService.presentToast('Vous devez être connecté à internet pour effectuer la dépose.');
            }
        }
        else {
            this.toastService.presentToast(`Vous devez sélectionner au moins un ${this.objectLabel}`)
        }
    }

    public redirectAfterTake(hasErrors: boolean = false): void {
        this.navCtrl
            .pop()
            .then(() => {
                if (!hasErrors) {
                    this.finishAction();
                }
            });
    }

    public testColisDepose(barCode: string, isManualInput: boolean = false): void {
        const priseExists = this.priseExists(barCode);
        if (priseExists) {
            if (isManualInput || !this.fromStock) {
                this.saveMouvementTracaWrapper(barCode);
            }
            else {
                this.unsubscribeZebraScanObserver();
                this.alertController
                    .create({
                        title: `Vous avez sélectionné l'${this.objectLabel} ${barCode}`,
                        buttons: [
                            {
                                text: 'Annuler',
                                handler: () => {
                                    this.launchZebraScanObserver();
                                },
                            },
                            {
                                text: 'Confirmer',
                                handler: () => {
                                    this.saveMouvementTracaWrapper(barCode);
                                },
                                cssClass: 'alert-success'
                            }
                        ]
                    })
                    .present();
            }
        }
        else {
            this.toastService.presentToast(`Cet ${this.objectLabel} ne correspond à aucune prise`);
        }
    }

    public get objectLabel(): string {
        return this.fromStock
            ? 'article'
            : 'objet';
    }

    private saveMouvementTracaWrapper(barCode: string): void {
        if (this.fromStock) {
            this.saveMouvementTraca(barCode);
            this.launchZebraScanObserver();
        }
        else {
            this.navCtrl.push(DeposeConfirmPage, {
                location: this.emplacement,
                barCode,
                fromStock: this.fromStock,
                validateDepose: (comment, signature) => {
                    this.saveMouvementTraca(barCode, comment, signature);
                }
            });
        }
    }

    private saveMouvementTraca(barCode: string, comment?: string, signature?: string): void {
        const firstPriseMatchingIndex = this.colisPrise.findIndex(({ref_article}) => (ref_article === barCode));
        let quantity;
        if (firstPriseMatchingIndex > -1) {
            quantity = this.colisPrise[firstPriseMatchingIndex].quantity;
            this.prisesToFinish.push(this.colisPrise[firstPriseMatchingIndex].id);
            this.colisPrise[firstPriseMatchingIndex].hidden = true;
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
        this.refreshDeposeListComponent();
    }

    private refreshPriseListComponent(): void {
        this.priseListConfig = this.tracaListFactory.createListConfig(
            this.colisPrise.filter(({hidden}) => !hidden),
            true,
            {
                uploadItem: ({object}) => {
                    this.testColisDepose(object.value, true);
                }
            }
        );
    }

    private refreshDeposeListComponent(): void {
        this.deposeListConfig = this.tracaListFactory.createListConfig(
            this.colisDepose,
            false,
            {
                location: this.emplacement,
                validate: () => this.finishTaking(),
                removeItem: TracaListFactoryService.CreateRemoveItemFromListHandler(
                    this.colisDepose,
                    this.colisPrise,
                    () => {
                        this.refreshPriseListComponent();
                        this.refreshDeposeListComponent();
                    })
            }
        );
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

    private launchZebraScanObserver(): void {
        this.unsubscribeZebraScanObserver();
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testColisDepose(barcode);
        });
    }

    private unsubscribeZebraScanObserver(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }
}
