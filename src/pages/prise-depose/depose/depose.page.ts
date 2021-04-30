import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Emplacement} from '@entities/emplacement';
import {MouvementTraca} from '@entities/mouvement-traca';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {from, Observable, of, Subscription, zip} from 'rxjs';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {TrackingListFactoryService} from '@app/common/services/tracking-list-factory.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {AlertController} from '@ionic/angular';
import {NavService} from '@app/common/services/nav.service';
import {flatMap, map, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {PageComponent} from '@pages/page.component';
import {Nature} from '@entities/nature';
import {Translation} from "@entities/translation";
import {AlertManagerService} from "@app/common/services/alert-manager.service";
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {MovementConfirmType} from '@pages/prise-depose/movement-confirm/movement-confirm-type';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'wii-depose',
    templateUrl: './depose.page.html',
    styleUrls: ['./depose.page.scss'],
})
export class DeposePage extends PageComponent implements CanLeave {

    private static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    public readonly listIdentifierName;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public colisPrise: Array<MouvementTraca&{hidden?: boolean}>;
    public colisDepose: Array<MouvementTraca>;

    public priseListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public deposeListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public listBoldValues: Array<string>;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loading: boolean;

    public fromStock: boolean;

    private saveSubscription: Subscription;

    private finishAction: () => void;

    private apiLoading: boolean;

    private operator: string;

    private natureTranslation: Array<Translation>;
    private allowedNatureIdsForLocation: Array<number>;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    public constructor(private network: Network,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.listIdentifierName = TrackingListFactoryService.TRACKING_IDENTIFIER_NAME;
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
        this.trackingListFactory.enableActions();
        if (!this.operator) {
            this.init();
            this.emplacement = this.currentNavParams.get('emplacement');
            this.finishAction = this.currentNavParams.get('finishAction');
            this.fromStock = Boolean(this.currentNavParams.get('fromStock'));
            zip(
                this.sqliteService.findBy(
                    'mouvement_traca',
                    [
                        `type LIKE 'prise'`,
                        `finished = 0`,
                        `fromStock = ${Number(this.fromStock)}`
                    ]
                ),
                this.storageService.getOperator(),
                !this.fromStock ? this.sqliteService.findAll('nature') : of([]),
                !this.fromStock ? this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + this.emplacement.id]) : of([]),
                this.sqliteService.findBy('translations', [ `menu LIKE 'natures'`])
            )
                .subscribe(([colisPrise, operator, natures, allowedNatureLocationArray, natureTranslation]) => {
                    this.colisPrise = colisPrise;
                    this.operator = operator;
                    this.natureTranslation = natureTranslation;
                    this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                        [id]: {label, color},
                        ...acc
                    }), {});

                    this.allowedNatureIdsForLocation = allowedNatureLocationArray.map(({nature_id}) => nature_id);
                    this.footerScannerComponent.fireZebraScan();

                    this.refreshDeposeListComponent();
                    this.refreshPriseListComponent();
                    this.loading = false;
                });
        }
        else {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        this.trackingListFactory.disableActions();
        this.footerScannerComponent.unsubscribeZebraScan();
        if (this.saveSubscription) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
        }
    }

    public wiiCanLeave(): boolean {
        return !this.trackingListFactory.alertPresented;
    }

    public finishTaking(): void {
        if (this.colisDepose && this.colisDepose.length > 0) {
            if(!this.apiLoading) {
                this.apiLoading = true;
                const multiDepose = (this.colisDepose.length > 1);
                let loader: HTMLIonLoadingElement;
                const online = (this.network.type !== 'none');

                if (!this.fromStock || online) {
                    const takingToFinish = this.colisPrise
                        .filter(({hidden}) => hidden)
                        .map(({id}) => id);
                    this.saveSubscription = this.localDataManager
                        .saveMouvementsTraca(this.colisDepose, takingToFinish)
                        .pipe(
                            flatMap(() => {
                                return online
                                    ? this.loadingService
                                        .presentLoading(multiDepose ? 'Envoi des déposes en cours...' : 'Envoi de la dépose en cours...')
                                        .pipe(
                                            tap((presentedLoader: HTMLIonLoadingElement) => {
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
        this.navService
            .pop()
            .subscribe(() => {
                if (!hasErrors) {
                    this.finishAction();
                }
            });
    }

    public testColisDepose(barCode: string, isManualInput: boolean = false): void {
        const pickingIndexes = this.findPickingIndexes(barCode);
        if (pickingIndexes.length > 0) {
            if (isManualInput || !this.fromStock) {
                this.saveMouvementTraca(pickingIndexes);
            }
            else {
                this.footerScannerComponent.unsubscribeZebraScan();
                from(this.alertController
                    .create({
                        header: `Vous avez sélectionné l'${this.objectLabel} ${barCode}`,
                        buttons: [
                            {
                                text: 'Annuler',
                                handler: () => {
                                    this.footerScannerComponent.fireZebraScan();
                                },
                            },
                            {
                                text: 'Confirmer',
                                handler: () => {
                                    this.saveMouvementTraca(pickingIndexes);
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
        else {
            this.toastService.presentToast(`Cet ${this.objectLabel} ne correspond à aucune prise`);
        }
    }

    public get objectLabel(): string {
        return TrackingListFactoryService.GetObjectLabel(this.fromStock);
    }

    public get displayPrisesList(): boolean {
        return this.colisPrise && this.colisPrise.filter(({hidden}) => !hidden).length > 0;
    }

    private saveMouvementTraca(pickingIndexes: Array<number>): void {
        if (pickingIndexes.length > 0) {
            const pickedNatures: Array<number> = pickingIndexes.reduce((acc: Array<number>, pickingIndex) => {
                const natureId = this.colisPrise[pickingIndex].nature_id;
                if (acc.indexOf(natureId) === -1) {
                    acc.push(natureId);
                }
                return acc;
            }, []);

            const allowedMovement = (
                this.fromStock
                || this.allowedNatureIdsForLocation.length === 0
                || pickedNatures.every((pickedNatureId) => (this.allowedNatureIdsForLocation.some((nature_id) => (nature_id === pickedNatureId))))
            );
            if (allowedMovement) {
                for (const pickingIndex of pickingIndexes) {
                    let quantity = this.colisPrise[pickingIndex].quantity;
                    this.colisPrise[pickingIndex].hidden = true;

                    this.colisDepose.unshift({
                        ref_article: this.colisPrise[pickingIndex].ref_article,
                        nature_id: this.colisPrise[pickingIndex].nature_id,
                        comment: this.colisPrise[pickingIndex].comment,
                        signature: this.colisPrise[pickingIndex].signature,
                        fromStock: Number(this.fromStock),
                        quantity,
                        type: DeposePage.MOUVEMENT_TRACA_DEPOSE,
                        operateur: this.operator,
                        photo: this.colisPrise[pickingIndex].photo,
                        ref_emplacement: this.emplacement.label,
                        date: moment().format(),
                        freeFields: this.colisPrise[pickingIndex].freeFields
                    });
                    this.refreshPriseListComponent();
                    this.refreshDeposeListComponent();
                    this.footerScannerComponent.fireZebraScan();
                }
            }
            else {
                const natureLabel = 'nature';
                const natureTranslation = this.natureTranslation.find((translation) => (translation.label === natureLabel));
                const translatedNatureLabel = (natureTranslation ? (natureTranslation.translation || natureTranslation.label) : natureLabel);
                const {ref_article, nature_id} = this.colisPrise[pickingIndexes[0]] || {};
                const nature = this.natureIdsToConfig[nature_id];
                const natureValue = (nature ? nature.label : 'non défini');
                from(this.alertController
                    .create({
                        header: 'Erreur',
                        cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
                        message: `Le colis <strong>${ref_article}</strong>`
                            + ` de ${translatedNatureLabel} <strong>${natureValue}</strong>`
                            + ` ne peut pas être déposé sur l'emplacement <strong>${this.emplacement.label}</strong>.`,
                        buttons: [{
                            text: 'Confirmer',
                            cssClass: 'alert-danger'
                        }]
                    })
                ).subscribe((alert: HTMLIonAlertElement) => {
                    let audio = new Audio('../../../assets/sounds/Error-sound.mp3');
                    audio.load();
                    audio.play();
                    alert.present();
                })
            }
        }
    }

    private updatePicking(barCode: string,
                          {quantity, comment, signature, photo, natureId, freeFields}: {quantity: number; comment?: string; signature?: string; photo?: string; natureId: number; freeFields: string}): void {
        const dropIndexes = this.findDropIndexes(barCode);

        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
                if (quantity > 0) {
                    this.colisDepose[dropIndex].quantity = quantity;
                }
                this.colisDepose[dropIndex].comment = comment;
                this.colisDepose[dropIndex].signature = signature;
                this.colisDepose[dropIndex].photo = photo;
                this.colisDepose[dropIndex].nature_id = natureId;
                this.colisDepose[dropIndex].freeFields = freeFields;
            }
            this.refreshPriseListComponent();
            this.refreshDeposeListComponent();
        }

        this.footerScannerComponent.fireZebraScan();
    }

    private refreshPriseListComponent(): void {
        const natureLabel = this.natureTranslation.filter((translation) => translation.label === 'nature')[0];
        this.priseListConfig = this.trackingListFactory.createListConfig(
            this.colisPrise
                .filter(({hidden}) => !hidden)
                .map(({subPacks, ...movements}) => movements),
            TrackingListFactoryService.LIST_TYPE_DROP_SUB,
            {
                objectLabel: this.objectLabel,
                rightIcon: {
                    mode: 'upload',
                    action: ({object}) => {
                        this.testColisDepose(object.value, true);
                    }
                },
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: natureLabel.translation || natureLabel.label,
            }
        );
    }

    private refreshDeposeListComponent(): void {
        const natureLabel = this.natureTranslation.filter((translation) => translation.label === 'nature')[0];
        this.deposeListConfig = this.trackingListFactory.createListConfig(
            this.colisDepose.map(({subPacks, ...movements}) => movements),
            TrackingListFactoryService.LIST_TYPE_DROP_MAIN,
            {
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: natureLabel.translation || natureLabel.label,
                objectLabel: this.objectLabel,
                location: this.emplacement,
                validate: () => this.finishTaking(),
                confirmItem: !this.fromStock
                    ? ({object: {value: barCode}}: { object?: { value?: string } }) => {
                        // we get first
                        const [dropIndex] = this.findDropIndexes(barCode);
                        if (dropIndex !== undefined) {
                            const {quantity, comment, signature, photo, nature_id: natureId, freeFields} = this.colisDepose[dropIndex];
                            this.trackingListFactory.disableActions();
                            this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                                fromStock: this.fromStock,
                                location: this.emplacement,
                                barCode,
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
                                movementType: MovementConfirmType.DROP,
                                natureTranslationLabel: natureLabel.translation || natureLabel.label,
                            });
                        }
                    }
                    : undefined,
                rightIcon: {
                    mode: 'remove',
                    action: TrackingListFactoryService.CreateRemoveItemFromListHandler(
                        this.colisDepose,
                        this.colisPrise,
                        () => {
                            this.refreshPriseListComponent();
                            this.refreshDeposeListComponent();
                        }
                    )
                }
            }
        );
    }

    private init(): void {
        this.loading = true;
        this.apiLoading = false;
        this.colisDepose = [];
        this.colisPrise = [];
    }

    private findPickingIndexes(barCode: string): Array<number> {
        return this.colisPrise.reduce(
            (acc: Array<number>, {ref_article, hidden}, currentIndex) => {
                if (ref_article === barCode
                    && !hidden) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }

    private findDropIndexes(barCode: string): Array<number> {
        return this.colisDepose.reduce(
            (acc: Array<number>, {ref_article}, currentIndex) => {
                if (ref_article === barCode) {
                    acc.push(currentIndex);
                }
                return acc;
            },
            []
        );
    }
}
