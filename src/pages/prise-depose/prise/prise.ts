import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {ChangeDetectorRef} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
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
import {flatMap, map, tap} from 'rxjs/operators';
import {Network} from '@ionic-native/network';
import {of} from 'rxjs/observable/of';
import {ApiService} from '@app/services/api.service';
import {LoadingService} from '@app/services/loading.service';
import {from} from 'rxjs/observable/from';
import {SqliteProvider} from "@providers/sqlite/sqlite";


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
    public colisPriseAlreadySaved: Array<MouvementTraca>;

    public listHeader: HeaderConfig;
    public listBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string>;

    public loading: boolean;
    public barcodeCheckLoading: boolean;

    public fromStock: boolean;

    private zebraScanSubscription: Subscription;
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
        this.finishAction = this.navParams.get('finishAction');
        this.emplacement = this.navParams.get('emplacement');
        this.fromStock = Boolean(this.navParams.get('fromStock'));

        Observable.zip(
            this.storageService.getOperateur(),
            this.sqliteProvider.getPrises(this.fromStock)
        )
        .subscribe(([operator, colisPriseAlreadySaved]) => {
            console.log(colisPriseAlreadySaved);
            this.operator = operator;
            this.colisPriseAlreadySaved = colisPriseAlreadySaved;

            this.launchZebraScanObserver();

            this.refreshListComponent();
            this.loading = false;
        });
    }

    public ionViewWillLeave(): void {
        this.barcodeCheckLoading = false;
        this.unsubscribeZebraScanObserver();
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
            if (!this.fromStock || this.network.type !== 'none') {
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
                                if (isManualAdd) {
                                    this.saveMouvementTraca(barCode, quantity);
                                }
                                else {
                                    this.unsubscribeZebraScanObserver();
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
                                                        this.launchZebraScanObserver();
                                                    }
                                                },
                                                {
                                                    text: 'Confirmer',
                                                    handler: () => {
                                                        this.saveMouvementTraca(barCode, quantity);
                                                        this.launchZebraScanObserver();
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
        return this.fromStock
            ? 'article'
            : 'objet';
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
        this.colisPriseAlreadySaved = [];
    }

    private existsOnLocation(barCode: string): Observable<number|boolean> {
        return this.fromStock
            ? this.apiService
                .requestApi('get', ApiService.GET_ARTICLES, {
                    barCode,
                    location: this.emplacement.label
                })
                .pipe(
                    map((res) => (
                        res &&
                        res.success &&
                        res.articles &&
                        (res.articles.length > 0)
                    ))
                )
            : of(true)
    }

    private launchZebraScanObserver(): void {
        this.unsubscribeZebraScanObserver();
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    private unsubscribeZebraScanObserver(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }
}
