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
import {TrackingListFactoryService} from '@app/common/services/tracking-list-factory.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {filter, flatMap, map, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/common/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {MovementConfirmType} from '@pages/prise-depose/movement-confirm/movement-confirm-type';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TranslationService} from '@app/common/services/translations.service';
import {Translations} from '@entities/translation';
import {Nature} from '@entities/nature';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';


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
    public colisPrise: Array<MouvementTraca & {loading?: boolean; subPacks?: Array<MouvementTraca>;}>;
    public currentPacksOnLocation: Array<MouvementTraca&{hidden?: boolean}>;
    public colisPriseAlreadySaved: Array<MouvementTraca>;

    public listPacksOnLocationHeader: HeaderConfig;
    public listPacksOnLocationBody: Array<ListPanelItemConfig>;

    public readonly listIdentifierName = TrackingListFactoryService.TRACKING_IDENTIFIER_NAME;

    public listTakingHeader: HeaderConfig;
    public listTakingBody: Array<ListPanelItemConfig>;
    public listBoldValues: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;

    public loading: boolean;
    public barcodeCheckLoading: boolean;

    public fromStock: boolean;

    private barcodeCheckSubscription: Subscription;
    private saveSubscription: Subscription;

    private finishAction: () => void;
    private operator: string;
    private natureTranslations: Translations;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    private viewEntered: boolean;

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       private translationService: TranslationService,
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
        this.trackingListFactory.enableActions();

        zip(
            this.storageService.getString(StorageKeyEnum.OPERATOR),
            this.sqliteService.getPrises(this.fromStock),
            (this.networkService.hasNetwork() && this.emplacement && !this.fromStock
                ? this.apiService.requestApi(ApiService.GET_TRACKING_DROPS, {params: {location: this.emplacement.label}})
                : of({trackingDrops: []})),
            !this.fromStock ? this.sqliteService.findAll('nature') : of([]),
            this.translationService.get(null, `Traçabilité`, `Général`)
        )
            .subscribe(([operator, colisPriseAlreadySaved, {trackingDrops}, natures, natureTranslations]) => {
                this.operator = operator;
                this.colisPriseAlreadySaved = colisPriseAlreadySaved;
                this.currentPacksOnLocation = trackingDrops;
                this.footerScannerComponent.fireZebraScan();
                this.natureTranslations = natureTranslations;

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
        this.viewEntered = false;
        this.trackingListFactory.disableActions();
        this.footerScannerComponent.unsubscribeZebraScan();
        if (this.barcodeCheckSubscription) {
            this.barcodeCheckSubscription.unsubscribe();
            this.barcodeCheckSubscription = undefined;
        }
        this.unsubscribeSaveSubscription();
    }

    public wiiCanLeave(): boolean {
        return !this.barcodeCheckLoading && !this.saveSubscription && !this.trackingListFactory.alertPresented;
    }

    public finishTaking(): void {
        if (this.colisPrise && this.colisPrise.length > 0) {
            if (this.colisPrise.some(({loading}) => loading)) {
                this.toastService.presentToast(`Veuillez attendre le chargement de tous les colis`);
            }
            else {
                const multiPrise = (this.colisPrise.length > 1);
                if (!this.saveSubscription) {
                    const movementsToSave = this.colisPrise.filter(({isGroup}) => !isGroup);
                    const groupingMovements = this.colisPrise.filter(({isGroup}) => isGroup);

                    const online = this.networkService.hasNetwork();
                    if (!this.fromStock
                        && !online
                        && groupingMovements.length > 0) {
                        this.toastService.presentToast('Votre prise contient des groupes, veuillez vous connecter à internet pour continuer.');
                        return;
                    }

                    this.saveSubscription = this.loadingService
                        .presentLoadingWhile({
                            message: multiPrise ? 'Envoi des prises en cours...' : 'Envoi de la prise en cours...',
                            event: () => {
                                return this.localDataManager
                                    .saveTrackingMovements(movementsToSave.map(({loading, ...tracking}) => tracking))
                                    .pipe(
                                        flatMap(() => (
                                            online
                                                ? this.localDataManager
                                                    .sendMouvementTraca(this.fromStock)
                                                    .pipe(
                                                        flatMap(() => this.postGroupingMovements(groupingMovements)),
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
                            }
                        })
                        .subscribe(
                            () => {
                                this.unsubscribeSaveSubscription();
                                this.redirectAfterTake();
                            },
                            (error) => {
                                this.unsubscribeSaveSubscription();
                                throw error;
                            });
                }
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
                this.processTackingBarCode(barCode, isManualAdd, 1);
            }
            else if (this.networkService.hasNetwork()) {
                this.barcodeCheckLoading = true;
                let loader: HTMLIonLoadingElement;
                this.barcodeCheckSubscription = this.loadingService
                    .presentLoading('Vérification...')
                    .pipe(
                        tap((presentedLoader) => {
                            loader = presentedLoader;
                        }),
                        flatMap(() => this.checkArticleOnLocation(barCode)),
                        flatMap(({res, quantity}) => from(loader.dismiss()).pipe(
                            tap(() => {
                                loader = undefined;
                            }),
                            map(() => ({res, quantity}))
                        ))
                    )
                    .subscribe(
                        ({res, quantity}) => {
                            const article = (
                                res
                                && res.success
                                && res.article
                            );

                            if(article && quantity > 0 && article.currentLogisticUnitId) {
                                this.alertService.show({
                                    message: `L'article ${article.barCode} sera enlevé de l'unité logistique ${article.currentLogisticUnitCode}`,
                                    buttons: [{
                                        text: 'Annuler',
                                        role: 'cancel',
                                        handler: () => this.barcodeCheckLoading = false,
                                    }, {
                                        text: 'Confirmer',
                                        cssClass: 'alert-success',
                                        handler: () => this.processTackingBarCode(barCode, isManualAdd, quantity),
                                    }]
                                })
                            } else {
                                this.processTackingBarCode(barCode, isManualAdd, quantity);
                            }
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
        return TrackingListFactoryService.GetObjectLabel(this.fromStock);
    }

    private get toTakeOngoingPacks() {
        return this.currentPacksOnLocation
            ? this.currentPacksOnLocation
                .filter(({hidden, ref_article: ongoingBarcode}) => (
                    !hidden
                    && !this.colisPrise.some(({ref_article: takeBarCode}) => takeBarCode === ongoingBarcode)
                ))
                .map(({subPacks, ...movements}) => movements)
            : [];
    }

    public get displayPacksOnLocationsList(): boolean {
        return this.currentPacksOnLocation && this.toTakeOngoingPacks.length > 0;
    }

    private saveTrackingMovement(barCode: string, quantity: number, loading: boolean = false): void {
        this.colisPrise.unshift({
            ref_article: barCode,
            type: PrisePage.MOUVEMENT_TRACA_PRISE,
            operateur: this.operator,
            ref_emplacement: this.emplacement.label,
            finished: 0,
            loading,
            fromStock: Number(this.fromStock),
            quantity,
            date: moment().format()
        });
        this.setPackOnLocationHidden(barCode, true);
        this.refreshListComponent();
    }

    private updateTrackingMovementNature(barCode: string, natureId?: number, groupData?: any): void {
        const indexesToUpdate = this.findTakingIndexes(barCode);
        for(const index of indexesToUpdate) {
            this.colisPrise[index].nature_id = natureId;
            this.colisPrise[index].loading = false;
            if (groupData) {
                this.colisPrise[index].isGroup = 1;
                this.colisPrise[index].subPacks = groupData.packs;
            }
        }
        this.refreshListComponent();
        this.footerScannerComponent.fireZebraScan();
    }

    private refreshListComponent(): void {
        const natureLabel = TranslationService.Translate(this.natureTranslations, 'Nature');
        const {header: listTakingHeader, body: listTakingBody} = this.trackingListFactory.createListConfig(
            this.colisPrise,
            TrackingListFactoryService.LIST_TYPE_TAKING_MAIN,
            {
                objectLabel: this.objectLabel,
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: natureLabel,
                location: this.emplacement,
                headerRightIcon: {
                    color: 'primary',
                    name: 'scan-photo.svg',
                    action: () => {
                        this.footerScannerComponent.scan();
                    }
                },
                confirmItem: !this.fromStock
                    ? ({object: {value: barCode}}: { object?: { value?: string } }) => {
                        // we get first
                        const [dropIndex] = this.findTakingIndexes(barCode);
                        if (dropIndex !== undefined) {
                            const {quantity, comment, signature, photo, nature_id: natureId, freeFields, isGroup, subPacks} = this.colisPrise[dropIndex];
                            this.trackingListFactory.disableActions();
                            this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                                fromStock: this.fromStock,
                                location: this.emplacement,
                                barCode,
                                isGroup,
                                subPacks,
                                values: {
                                    quantity,
                                    comment,
                                    signature,
                                    natureId,
                                    photo,
                                    freeFields
                                },
                                validate: (values) => {
                                    this.updatePicking(barCode, values);
                                },
                                movementType: MovementConfirmType.TAKE,
                                natureTranslationLabel: natureLabel,
                            });
                        }
                    }
                    : undefined,
                rightIcon: {
                    mode: 'remove',
                    action: this.cancelPickingAction()
                }
            }
        );
        this.listTakingHeader = listTakingHeader;
        this.listTakingBody = listTakingBody;

        const {header: listPacksOnLocationHeader, body: listPacksOnLocationBody} = this.trackingListFactory.createListConfig(
            this.toTakeOngoingPacks,
            TrackingListFactoryService.LIST_TYPE_TAKING_SUB,
            {
                headerRightIcon: {
                    name: 'up.svg',
                    action: () => {
                        this.takeAll()
                    },
                },
                objectLabel: this.objectLabel,
                rightIcon: {
                    mode: 'upload',
                    action: ({object}) => {
                        this.testIfBarcodeEquals(object.value, true);
                    }
                }
            }
        );

        this.listPacksOnLocationHeader = listPacksOnLocationHeader;
        this.listPacksOnLocationBody = listPacksOnLocationBody;
    }

    private takeAll() {
        this.toTakeOngoingPacks.forEach(({ref_article}) => this.testIfBarcodeEquals(ref_article, true));
    }

    private cancelPickingAction(): (info: { [name: string]: { label: string; value?: string; } }) => void {
        return TrackingListFactoryService.CreateRemoveItemFromListHandler(this.colisPrise, undefined, (barCode) => {
            this.setPackOnLocationHidden(barCode, false);
            this.refreshListComponent();
        });
    }

    private init(fromStart: boolean = true): void {
        this.viewEntered = true;
        this.loading = true;
        this.listTakingBody = [];
        if (fromStart) {
            this.colisPrise = [];
        }
        this.currentPacksOnLocation = [];
        this.colisPriseAlreadySaved = [];
    }

    private updatePicking(barCode: string,
                          {quantity, comment, signature, photo, natureId, freeFields, subPacks}: {quantity: number; comment?: string; signature?: string; photo?: string; natureId: number; freeFields: string; subPacks: any;}): void {
        const dropIndexes = this.findTakingIndexes(barCode);
        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
                if (quantity > 0) {
                    this.colisPrise[dropIndex].quantity = quantity;
                }
                this.colisPrise[dropIndex].comment = comment;
                this.colisPrise[dropIndex].signature = signature;
                this.colisPrise[dropIndex].photo = photo;
                this.colisPrise[dropIndex].nature_id = natureId;
                this.colisPrise[dropIndex].freeFields = freeFields;
                this.colisPrise[dropIndex].subPacks = subPacks;
            }
            this.refreshListComponent();
        }
        this.footerScannerComponent.fireZebraScan();
    }

    private checkArticleOnLocation(barCode: string): Observable<{res: any, quantity: number}> {
        return this.apiService
            .requestApi(ApiService.GET_ARTICLES, {
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
                            {duration: ToastService.LONG_DURATION}
                        );
                    }
                }),
                map((res) => ({
                    res,
                    quantity: (
                        res
                        && res.success
                        && res.article
                        && res.article.can_transfer
                        && res.article.quantity
                    )
                    || -1
                })),
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

    private findTakingIndexes(barCode: string): Array<number> {
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

    private processTackingBarCode(barCode: string, isManualAdd: boolean, quantity: number) {
        this.barcodeCheckLoading = false;
        if (quantity > 0) {
            if (this.colisPrise &&
                (
                    this.colisPrise.some((colis) => ((colis.ref_article || '').toLocaleLowerCase() === (barCode || '').toLocaleLowerCase())) ||
                    this.colisPriseAlreadySaved.some((colis) => ((colis.ref_article || '').toLocaleLowerCase() === (barCode || '').toLocaleLowerCase()))
                )) {
                this.toastService.presentToast('Cette prise a déjà été effectuée', {audio: true});
            }
            else {
                if (isManualAdd || !this.fromStock) {
                    const needNatureChecks = (!this.fromStock && this.networkService.hasNetwork());
                    this.saveTrackingMovement(barCode, quantity, needNatureChecks);

                    if (needNatureChecks) {
                        this.apiService
                            .requestApi(ApiService.GET_PACK_DATA, {
                                params: {
                                    code: barCode,
                                    nature: 1,
                                    group: 1
                                }
                            })
                            .pipe(
                                flatMap(({nature, group, isPack, isGroup}) => (
                                    nature
                                        ? this.sqliteService.importNaturesData({natures: [nature]}, false).pipe(map(() => ({nature, group, isPack, isGroup})))
                                        : of({nature, group, isPack, isGroup})
                                )),
                                tap(({nature}) => {
                                    if (nature) {
                                        const {id, color, label} = nature;
                                        this.natureIdsToConfig[id] = {label, color};
                                    }
                                }),
                                filter(() => this.viewEntered)
                            )
                            .subscribe(
                                ({nature, group, isPack, isGroup}) => {
                                    if (isPack || !isGroup) {
                                        if (group) {
                                            this.alertService.show({
                                                header: 'Confirmation',
                                                backdropDismiss: false,
                                                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                                                message: `Le colis ${barCode} est contenu dans le groupe ${group.code}.
                                                      Confirmer la prise l'enlèvera du groupe.`,
                                                buttons: [
                                                    {
                                                        text: 'Confirmer',
                                                        cssClass: 'alert-success',
                                                        handler: () => {
                                                            this.updateTrackingMovementNature(barCode, nature && nature.id);
                                                        }
                                                    },
                                                    {
                                                        text: 'Annuler',
                                                        cssClass: 'alert-danger',
                                                        role: 'cancel',
                                                        handler: () => {
                                                            const cancelPicking = this.cancelPickingAction();
                                                            cancelPicking({object: {value: barCode, label: barCode}});
                                                        }
                                                    }
                                                ]
                                            });
                                        }
                                        else {
                                            this.updateTrackingMovementNature(barCode, nature && nature.id);
                                        }
                                    }
                                    else { // isGroup === true
                                        this.updateTrackingMovementNature(barCode, nature && nature.id, group);
                                    }
                                },
                                () => this.updateTrackingMovementNature(barCode)
                            );
                    }
                }
                else {
                    this.footerScannerComponent.unsubscribeZebraScan();
                    this.saveTrackingMovement(barCode, quantity);
                    this.footerScannerComponent.fireZebraScan();
                }
            }
        }
    }

    private postGroupingMovements(groupingMovements) {
        return !this.fromStock && groupingMovements.length > 0
            ? this.apiService.requestApi(ApiService.POST_GROUP_TRACKINGS, {
                pathParams: {mode: 'picking'},
                params: this.localDataManager.extractTrackingMovementFiles(this.localDataManager.mapTrackingMovements(groupingMovements))
            })
                .pipe(
                    flatMap((res) => {
                        if (!res || !res.success) {
                            this.toastService.presentToast(res.message || 'Une erreur inconnue est survenue');
                            throw new Error(res.message);
                        }
                        else {
                            return (res.tracking)
                                ? this.sqliteService.deleteBy('mouvement_traca', ['fromStock = 0'])
                                    .pipe(flatMap(() => this.sqliteService.importMouvementTraca({trackingTaking: res.tracking})))
                                : of(undefined);
                        }
                    })
                )
            : of(undefined);
    }

    private unsubscribeSaveSubscription() {
        if (this.saveSubscription && !this.saveSubscription.closed) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
        }
    }
}
