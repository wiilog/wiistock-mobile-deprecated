import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {ChangeDetectorRef} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {ToastService} from '@app/services/toast.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {ListPanelItemConfig} from '@helpers/components/panel/model/list-panel/list-panel-item-config';
import {TracaListFactoryService} from '@app/services/traca-list-factory.service';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import {StorageService} from '@app/services/storage.service';
import moment from 'moment';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {flatMap, map, tap} from 'rxjs/operators';
import {Network} from '@ionic-native/network';
import {of} from 'rxjs/observable/of';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {from} from 'rxjs/observable/from';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';


@IonicPage()
@Component({
    selector: 'page-prise',
    templateUrl: 'prise.html',
})
export class PrisePage {

    private static readonly MOUVEMENT_TRACA_PRISE = 'prise';

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca>;
    public currentPacksOnLocation: Array<MouvementTraca&{hidden?: boolean}>;
    public colisPriseAlreadySaved: Array<MouvementTraca>;

    public listPacksOnLocationHeader: HeaderConfig;
    public listPacksOnLocationBody: Array<ListPanelItemConfig>;

    public listTakingHeader: HeaderConfig;
    public listTakingBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loading: boolean;
    public barcodeCheckLoading: boolean;

    public fromStock: boolean;

    private barcodeCheckSubscription: Subscription;
    private saveSubscription: Subscription;

    private finishAction: () => void;
    private operator: string;
    private apiLoading: boolean;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private network: Network,
                       private apiService: ApiService,
                       private sqliteProvider: SqliteProvider,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
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
        this.finishAction = this.navParams.get('finishAction');
        this.emplacement = this.navParams.get('emplacement');
        this.fromStock = Boolean(this.navParams.get('fromStock'));

        Observable
            .zip(
                this.storageService.getOperateur(),
                this.sqliteProvider.getPrises(this.fromStock),
                (this.network.type !== 'none' && this.emplacement && !this.fromStock
                    ? this.apiService.requestApi('get', ApiService.GET_TRACKING_DROPS, {params: {location: this.emplacement.label}})
                    : of({trackingDrops: []}))
            )
            .subscribe(([operator, colisPriseAlreadySaved, {trackingDrops}]) => {
                this.operator = operator;
                this.colisPriseAlreadySaved = colisPriseAlreadySaved;
                this.currentPacksOnLocation = trackingDrops;
                this.footerScannerComponent.fireZebraScan();

                this.refreshListComponent();
                this.loading = false;
            });
    }

    public ionViewWillLeave(): void {
        this.barcodeCheckLoading = false;
        this.footerScannerComponent.unsubscribeZebraScan();
        if (this.barcodeCheckSubscription) {
            this.barcodeCheckSubscription.unsubscribe();
            this.barcodeCheckSubscription = undefined;
        }
        if (this.saveSubscription) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
        }
    }


    public ionViewCanLeave(): boolean {
        return !this.footerScannerComponent.isScanning && !this.barcodeCheckLoading && !this.apiLoading;
    }

    public finishTaking(): void {
        if (this.colisPrise && this.colisPrise.length > 0) {
            const multiPrise = (this.colisPrise.length > 1);
            if (!this.apiLoading) {
                this.apiLoading = true;
                let loader: Loading;
                this.saveSubscription = this.localDataManager
                    .saveMouvementsTraca(this.colisPrise)
                    .pipe(
                        flatMap(() => {
                            const online = (this.network.type !== 'none');
                            return online
                                ? this.loadingService
                                    .presentLoading(multiPrise ? 'Envoi des prises en cours...' : 'Envoi de la prise en cours...')
                                    .pipe(
                                        tap((presentedLoader: Loading) =>  {
                                            loader = presentedLoader;
                                        }),
                                        map(() => online)
                                    )
                                : of(online)
                        }),
                        flatMap((online: boolean) => (
                            online
                                ? this.localDataManager
                                    .sendMouvementTraca(this.fromStock)
                                    .pipe(
                                        flatMap(() => (
                                            loader
                                                ? from(loader.dismiss())
                                                : of(undefined)
                                        )),
                                        tap(() => {
                                            loader = undefined;
                                        }),
                                        map(() => online)
                                    )
                                : of(online)
                        )),
                        // we display toast
                        flatMap((send: boolean) => {
                            const message = send
                                ? 'Les prises ont bien été sauvegardées'
                                : (multiPrise
                                    ? 'Prises sauvegardées localement, nous les enverrons au serveur une fois internet retrouvé'
                                    : 'Prise sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                            return this.toastService.presentToast(message);
                        })
                    )
                    .subscribe(
                        () => {
                            this.apiLoading = false;
                            this.redirectAfterTake();
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
            this.toastService.presentToast(`Vous devez scanner au moins un ${this.objectLabel}`)
        }
    }

    public redirectAfterTake(): void {
        this.navCtrl.pop()
            .then(() => {
                this.finishAction();
            });
    }

    public testIfBarcodeEquals(barCode: string, isManualAdd: boolean = false): void {
        if (!this.barcodeCheckLoading) {
            if (!this.fromStock) {
                this.processCheckBarCode(barCode, isManualAdd);
            }
            else if (this.network.type !== 'none') {
                this.barcodeCheckLoading = true;
                let loader: Loading;
                this.barcodeCheckSubscription = this.loadingService
                    .presentLoading('Vérification...')
                    .pipe(
                        tap((presentedLoader) => {
                            loader = presentedLoader;
                        }),
                        flatMap(() => this.existsOnLocation(barCode)),
                        flatMap((quantity) => from(loader.dismiss()).pipe(map(() => quantity)))
                    )
                    .subscribe((quantity) => {
                        this.processCheckBarCode(barCode, isManualAdd, quantity);
                    });
            }
            else {
                this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
            }
        }
        else {
            this.toastService.presentToast('Chargement...');
        }
    }

    public get objectLabel(): string {
        return TracaListFactoryService.GetObjectLabel(this.fromStock);
    }

    public get displayPacksOnLocationsList(): boolean {
        return this.currentPacksOnLocation && this.currentPacksOnLocation.filter(({hidden}) => !hidden).length > 0;
    }

    private saveMouvementTraca(barCode: string, quantity: boolean|number): void {
        this.colisPrise.push({
            ref_article: barCode,
            type: PrisePage.MOUVEMENT_TRACA_PRISE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            finished: 0,
            fromStock: Number(this.fromStock),
            ...(typeof quantity === 'number' ? {quantity} : {}),
            date: moment().format()
        });
        this.setPackOnLocationHidden(barCode, true);
        this.refreshListComponent();
        this.changeDetectorRef.detectChanges();
    }

    private refreshListComponent(): void {
        const {header: listTakingHeader, body: listTakingBody} = this.tracaListFactory.createListConfig(
            this.colisPrise,
            TracaListFactoryService.LIST_TYPE_TAKING_MAIN,
            {
                objectLabel: this.objectLabel,
                location: this.emplacement,
                validate: () => this.finishTaking(),
                removeItem: TracaListFactoryService.CreateRemoveItemFromListHandler(this.colisPrise, undefined, (barCode) => {
                    this.setPackOnLocationHidden(barCode, false);
                    this.refreshListComponent();
                }),
                removeConfirmationMessage: 'Êtes-vous sur de vouloir supprimer cet élément ?'
            }
        );
        this.listTakingHeader = listTakingHeader;
        this.listTakingBody = listTakingBody;

        const {header: listPacksOnLocationHeader, body: listPacksOnLocationBody} = this.tracaListFactory.createListConfig(
            this.currentPacksOnLocation.filter(({hidden}) => !hidden),
            TracaListFactoryService.LIST_TYPE_TAKING_SUB,
            {
                objectLabel: this.objectLabel,
                uploadItem: ({object}) => {
                    this.testIfBarcodeEquals(object.value, true);
                }
            }
        );

        this.listPacksOnLocationHeader = listPacksOnLocationHeader;
        this.listPacksOnLocationBody = listPacksOnLocationBody;

    }

    private init(): void {
        this.loading = true;
        this.apiLoading = false;
        this.listTakingBody = [];
        this.colisPrise = [];
        this.currentPacksOnLocation = [];
        this.colisPriseAlreadySaved = [];
    }

    private existsOnLocation(barCode: string): Observable<number|boolean> {
        return this.apiService
            .requestApi('get', ApiService.GET_ARTICLES, {
                params: {
                    barCode,
                    location: this.emplacement.label
                }
            })
            .pipe(
                map((res) => (
                    res
                    && res.success
                    && res.articles
                    && (res.articles.length > 0)
                    && res.articles[0]
                    && res.articles[0].quantity
                ))
            );
    }

    private setPackOnLocationHidden(barCode: string, hidden: boolean): void {
        if (barCode) {
            const trackingIndex = this.currentPacksOnLocation.findIndex(({ref_article}) => (ref_article === barCode));
            if (trackingIndex > -1) {
                this.currentPacksOnLocation[trackingIndex].hidden = hidden;
            }
        }
    }

    private processCheckBarCode(barCode: string, isManualAdd: boolean, quantity: boolean|number = true) {
        this.barcodeCheckLoading = false;
        if (quantity) {
            if (this.colisPrise &&
                (
                    this.colisPrise.some((colis) => (colis.ref_article === barCode)) ||
                    this.colisPriseAlreadySaved.some((colis) => (colis.ref_article === barCode))
                )) {
                this.toastService.presentToast('Cette prise a déjà été effectuée');
            }
            else {
                if (isManualAdd || !this.fromStock) {
                    this.saveMouvementTraca(barCode, quantity);
                }
                else {
                    this.footerScannerComponent.unsubscribeZebraScan();
                    const quantitySuffix = (typeof quantity === 'number')
                        ? ` en quantité de ${quantity}`
                        : '';
                    this.alertController
                        .create({
                            title: `Prise de ${barCode}${quantitySuffix}`,
                            buttons: [
                                {
                                    text: 'Annuler',
                                    handler: () => {
                                        this.footerScannerComponent.fireZebraScan();
                                    }
                                },
                                {
                                    text: 'Confirmer',
                                    handler: () => {
                                        this.saveMouvementTraca(barCode, quantity);
                                        this.footerScannerComponent.fireZebraScan();
                                    },
                                    cssClass: 'alert-success'
                                }
                            ]
                        })
                        .present();
                }
            }
        }
        else {
            this.toastService.presentToast('Ce code barre n\'est pas présent sur cet emplacement');
        }
    }
}
