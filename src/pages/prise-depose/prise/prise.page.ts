import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Emplacement} from '@entities/emplacement';
import {MouvementTraca} from '@entities/mouvement-traca';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {from, Observable, of, Subscription, zip} from 'rxjs';
import {ApiService} from '@app/common/services/api.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {TracaListFactoryService} from '@app/common/services/traca-list-factory.service';
import {StorageService} from '@app/common/services/storage.service';
import {AlertController} from '@ionic/angular';
import {flatMap, map, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {Network} from '@ionic-native/network/ngx';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/common/services/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {Nature} from '@entities/nature';
import {ConfirmPageRoutingModule} from "../movement-confirm/movement-confirm-routing.module";


@Component({
    selector: 'wii-prise',
    templateUrl: './prise.page.html',
    styleUrls: ['./prise.page.scss'],
})
export class PrisePage extends PageComponent implements CanLeave {

    private static readonly MOUVEMENT_TRACA_PRISE = 'prise';

    @ViewChild('footerScannerComponent', {static: false})
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
    private saveMovementSubscription: Subscription;

    private finishAction: () => void;
    private operator: string;
    private apiLoading: boolean;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    public constructor(private network: Network,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private tracaListFactory: TracaListFactoryService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
        this.init(false);
        this.finishAction = this.currentNavParams.get('finishAction');
        this.emplacement = this.currentNavParams.get('emplacement');
        this.fromStock = Boolean(this.currentNavParams.get('fromStock'));

        zip(
            this.storageService.getOperator(),
            this.sqliteService.getPrises(this.fromStock),
            (this.network.type !== 'none' && this.emplacement && !this.fromStock
                ? this.apiService.requestApi('get', ApiService.GET_TRACKING_DROPS, {params: {location: this.emplacement.label}})
                : of({trackingDrops: []})),
            !this.fromStock ? this.sqliteService.findAll('nature') : of(undefined),
        )
            .subscribe(([operator, colisPriseAlreadySaved, {trackingDrops}, natures]) => {
                this.operator = operator;
                this.colisPriseAlreadySaved = colisPriseAlreadySaved;
                this.currentPacksOnLocation = trackingDrops;
                this.footerScannerComponent.fireZebraScan();

                if (natures) {
                    this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                        [id]: {label, color},
                        ...acc
                    }), {})
                }

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
        if (this.saveMovementSubscription) {
            this.saveMovementSubscription.unsubscribe();
            this.saveMovementSubscription = undefined;
        }
    }

    public wiiCanLeave(): boolean {
        return !this.barcodeCheckLoading && !this.apiLoading;
    }

    public finishTaking(): void {
        if (this.colisPrise && this.colisPrise.length > 0) {
            const multiPrise = (this.colisPrise.length > 1);
            if (!this.apiLoading) {
                this.apiLoading = true;
                let loader: HTMLIonLoadingElement;
                this.saveSubscription = this.localDataManager
                    .saveMouvementsTraca(this.colisPrise)
                    .pipe(
                        flatMap(() => {
                            const online = (this.network.type !== 'none');
                            return online
                                ? this.loadingService
                                    .presentLoading(multiPrise ? 'Envoi des prises en cours...' : 'Envoi de la prise en cours...')
                                    .pipe(
                                        tap((presentedLoader: HTMLIonLoadingElement) =>  {
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
        this.navService
            .pop()
            .subscribe(() => {
                this.finishAction();
            });
    }

    public testIfBarcodeEquals(barCode: string, isManualAdd: boolean = false): void {
        if (!this.barcodeCheckLoading) {
            if (!this.fromStock) {
                this.processTackingBarCode(barCode, isManualAdd);
            }
            else if (this.network.type !== 'none') {
                this.barcodeCheckLoading = true;
                let loader: HTMLIonLoadingElement;
                this.barcodeCheckSubscription = this.loadingService
                    .presentLoading('Vérification...')
                    .pipe(
                        tap((presentedLoader) => {
                            loader = presentedLoader;
                        }),
                        flatMap(() => this.checkArticleOnLocation(barCode)),
                        flatMap((quantity) => from(loader.dismiss()).pipe(
                            tap(() => {
                                loader = undefined;
                            }),
                            map(() => quantity)
                        ))
                    )
                    .subscribe(
                        (quantity) => {
                            this.processTackingBarCode(barCode, isManualAdd, quantity);
                        },
                        () => {
                            if (loader) {
                                loader.dismiss();
                            }
                            this.barcodeCheckLoading = false;
                            this.toastService.presentToast('Erreur serveur');
                        }
                    );
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

    private saveTrackingMovement(barCode: string, quantity: boolean|number, natureId?: number): void {
        this.colisPrise.push({
            ref_article: barCode,
            type: PrisePage.MOUVEMENT_TRACA_PRISE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            finished: 0,
            nature_id: natureId,
            fromStock: Number(this.fromStock),
            ...(typeof quantity === 'number' ? {quantity} : {}),
            date: moment().format()
        });
        this.setPackOnLocationHidden(barCode, true);
        this.refreshListComponent();
        this.changeDetectorRef.detectChanges();
        this.footerScannerComponent.fireZebraScan();
    }

    private refreshListComponent(): void {
        const {header: listTakingHeader, body: listTakingBody} = this.tracaListFactory.createListConfig(
            this.colisPrise,
            TracaListFactoryService.LIST_TYPE_TAKING_MAIN,
            {
                objectLabel: this.objectLabel,
                natureIdsToConfig: this.natureIdsToConfig,
                location: this.emplacement,
                validate: () => this.finishTaking(),
                confirmItem: !this.fromStock
                    ? ({object: {value: barCode}}: { object?: { value?: string } }) => {
                        // we get first
                        const [dropIndex] = this.findDropIndexes(barCode);
                        if (dropIndex !== undefined) {
                            const {comment, signature, photo, nature_id: natureId, freeFields} = this.colisPrise[dropIndex];
                            this.navService.push(ConfirmPageRoutingModule.PATH, {
                                location: this.emplacement,
                                barCode,
                                values: {
                                    comment,
                                    signature,
                                    natureId,
                                    photo,
                                    freeFields
                                },
                                validate: (values) => {
                                    this.updatePicking(barCode, values);
                                },
                                movementType: 'Prise'
                            });
                        }
                    }
                    : undefined,
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

    private init(fromStart: boolean = true): void {
        this.loading = true;
        this.apiLoading = false;
        this.listTakingBody = [];
        if (fromStart) {
            this.colisPrise = [];
        }
        this.currentPacksOnLocation = [];
        this.colisPriseAlreadySaved = [];
    }

    private updatePicking(barCode: string,
                          {comment, signature, photo, natureId, freeFields}: {comment?: string; signature?: string; photo?: string; natureId: number; freeFields: string}): void {
        const dropIndexes = this.findDropIndexes(barCode);
        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
                this.colisPrise[dropIndex].comment = comment;
                this.colisPrise[dropIndex].signature = signature;
                this.colisPrise[dropIndex].photo = photo;
                this.colisPrise[dropIndex].nature_id = natureId;
                this.colisPrise[dropIndex].freeFields = freeFields;
            }
            this.refreshListComponent();
        }
        this.footerScannerComponent.fireZebraScan();
    }

    private checkArticleOnLocation(barCode: string): Observable<number|boolean> {
        return this.apiService
            .requestApi('get', ApiService.GET_ARTICLES, {
                params: {
                    barCode,
                    location: this.emplacement.label
                }
            })
            .pipe(
                tap((res) => {
                    const article = (
                        res
                        && res.success
                        && res.article
                    );
                    if (!article || !article.quantity || !article.can_transfer) {
                        const errorMessageCantTransfer = article.is_ref
                            ? 'un processus pouvant changer la quantité disponible est en cours ou elle est en statut inactif'
                            : 'la référence liée est en statut inactif';
                        const thisArticle = article.is_ref ? 'cette référence' : 'cet article';
                        this.toastService.presentToast(
                            !article
                                ? 'Ce code barre n\'est pas présent sur cet emplacement'
                                : (!article.quantity
                                    ? 'La quantité disponible de cet article est à 0'
                                    : `Vous ne pouvez effectuer de transfert sur ${thisArticle}, ${errorMessageCantTransfer}`),
                            ToastService.LONG_DURATION
                        );
                    }
                }),
                map((res) => (
                    res
                    && res.success
                    && res.article
                    && res.article.quantity
                    && res.article.can_transfer
                )),
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

    private findDropIndexes(barCode: string): Array<number> {
        return this.colisPrise.reduce(
            (acc: Array<number>, {ref_article}, currentIndex) => {
                if (ref_article === barCode) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private processTackingBarCode(barCode: string, isManualAdd: boolean, quantity: boolean|number = true) {
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
                this.footerScannerComponent.unsubscribeZebraScan();
                if (isManualAdd || !this.fromStock) {
                    let loader: HTMLIonLoadingElement;

                    if (this.saveMovementSubscription) {
                        this.saveMovementSubscription.unsubscribe();
                    }

                    this.saveMovementSubscription = (
                        (!this.fromStock && this.network.type !== 'none')
                            ? this.loadingService.presentLoading().pipe(
                                tap((createdLoader) => { loader = createdLoader; }),
                                flatMap(() => this.apiService.requestApi('get', ApiService.GET_PACK_NATURE, {pathParams: {code: barCode}}))
                            )
                            : of(undefined)
                    )
                        .pipe(
                            flatMap(({nature}) => this.sqliteService.importNaturesData({natures: [nature]}, false).pipe(map(() => nature))),
                            tap((nature) => {
                                if (nature) {
                                    const {id, color, label} = nature;
                                    this.natureIdsToConfig[id] = {label, color};
                                }
                            })
                        )
                        .subscribe(
                            ({id}) => {
                                this.saveTrackingMovement(barCode, quantity, id);
                                if (loader) {
                                    loader.dismiss();
                                }
                            },
                            () => {
                                this.saveTrackingMovement(barCode, quantity);
                                if (loader) {
                                    loader.dismiss();
                                }
                            }
                        );


                }
                else {
                    const quantitySuffix = (typeof quantity === 'number')
                        ? ` en quantité de ${quantity}`
                        : '';
                    from(this.alertController
                        .create({
                            header: `Prise de ${barCode}${quantitySuffix}`,
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
                                        this.saveTrackingMovement(barCode, quantity);
                                    },
                                    cssClass: 'alert-success'
                                }
                            ]
                        }))
                        .subscribe((alert: HTMLIonAlertElement) => {
                            alert.present();
                        });
                }
            }
        }
    }
}
