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
import {TracaListFactoryService} from '@app/common/services/traca-list-factory.service';
import {StorageService} from '@app/common/services/storage.service';
import {AlertController} from '@ionic/angular';
import {NavService} from '@app/common/services/nav.service';
import {flatMap, map, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {ConfirmPageRoutingModule} from '@pages/prise-depose/movement-confirm/movement-confirm-routing.module';
import {PageComponent} from '@pages/page.component';
import {Nature} from '@entities/nature';
import {Translation} from "../../../entities/translation";

@Component({
    selector: 'wii-depose',
    templateUrl: './depose.page.html',
    styleUrls: ['./depose.page.scss'],
})
export class DeposePage extends PageComponent {

    private static readonly MOUVEMENT_TRACA_DEPOSE = 'depose';

    @ViewChild('footerScannerComponent', {static: false})
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

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loading: boolean;

    public fromStock: boolean;

    private saveSubscription: Subscription;

    private finishAction: () => void;

    private apiLoading: boolean;

    private operator: string;

    private natureTranslation: Array<Translation>;

    private natureIdsToConfig: {[id: number]: { label: string; color?: string; }};

    public constructor(private network: Network,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqliteService: SqliteService,
                       private localDataManager: LocalDataManagerService,
                       private tracaListFactory: TracaListFactoryService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.init();
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
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
                !this.fromStock ? this.sqliteService.findAll('nature') : of(undefined),
                this.sqliteService.findBy(
                    'translations',
                    [
                        `menu LIKE 'natures'`,
                    ]
                )
            )
                .subscribe(([colisPrise, operator, natures, natureTranslation]) => {
                    this.colisPrise = colisPrise;
                    this.operator = operator;
                    this.natureTranslation = natureTranslation;
                    if (natures) {
                        this.natureIdsToConfig = natures.reduce((acc, {id, color, label}: Nature) => ({
                            [id]: {label, color},
                            ...acc
                        }), {})
                    }

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
        this.footerScannerComponent.unsubscribeZebraScan();
        if (this.saveSubscription) {
            this.saveSubscription.unsubscribe();
            this.saveSubscription = undefined;
        }
    }

    public finishTaking(): void {
        if (this.colisDepose && this.colisDepose.length > 0) {
            if(!this.apiLoading) {
                this.apiLoading = true;
                const multiDepose = (this.colisDepose.length > 1);
                let loader: HTMLIonLoadingElement;
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
        return TracaListFactoryService.GetObjectLabel(this.fromStock);
    }

    public get displayPrisesList(): boolean {
        return this.colisPrise && this.colisPrise.filter(({hidden}) => !hidden).length > 0;
    }

    private saveMouvementTraca(pickingIndexes: Array<number>): void {
        if (pickingIndexes.length > 0) {
            for(const pickingIndex of pickingIndexes) {
                let quantity = this.colisPrise[pickingIndex].quantity;
                this.prisesToFinish.push(this.colisPrise[pickingIndex].id);
                this.colisPrise[pickingIndex].hidden = true;
                console.log(this.colisPrise[pickingIndex]);
                this.colisDepose.push({
                    ref_article: this.colisPrise[pickingIndex].ref_article,
                    nature_id: this.colisPrise[pickingIndex].nature_id,
                    comment: this.colisPrise[pickingIndex].comment,
                    signature: this.colisPrise[pickingIndex].signature,
                    photo: this.colisPrise[pickingIndex].photo,
                    fromStock: Number(this.fromStock),
                    quantity,
                    type: DeposePage.MOUVEMENT_TRACA_DEPOSE,
                    operateur: this.operator,
                    ref_emplacement: this.emplacement.label,
                    date: moment().format(),
                    freeFields: this.colisPrise[pickingIndex].freeFields
                });
            }
        }

        this.refreshPriseListComponent();
        this.refreshDeposeListComponent();
        this.footerScannerComponent.fireZebraScan();
    }

    private updatePicking(barCode: string,
                          {comment, signature, photo, natureId, freeFields}: {comment?: string; signature?: string; photo?: string; natureId: number; freeFields: string}): void {
        const dropIndexes = this.findDropIndexes(barCode);

        if (dropIndexes.length > 0) {
            for(const dropIndex of dropIndexes) {
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
        this.priseListConfig = this.tracaListFactory.createListConfig(
            this.colisPrise.filter(({hidden}) => !hidden),
            TracaListFactoryService.LIST_TYPE_DROP_SUB,
            {
                objectLabel: this.objectLabel,
                uploadItem: ({object}) => {
                    this.testColisDepose(object.value, true);
                },
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: this.natureTranslation.filter((translation) => translation.label === 'nature')[0].translation,
            }
        );
    }

    private refreshDeposeListComponent(): void {
        this.deposeListConfig = this.tracaListFactory.createListConfig(
            this.colisDepose,
            TracaListFactoryService.LIST_TYPE_DROP_MAIN,
            {
                natureIdsToConfig: this.natureIdsToConfig,
                natureTranslation: this.natureTranslation.filter((translation) => translation.label === 'nature')[0].translation,
                objectLabel: this.objectLabel,
                location: this.emplacement,
                validate: () => this.finishTaking(),
                confirmItem: !this.fromStock
                    ? ({object: {value: barCode}}: { object?: { value?: string } }) => {
                        // we get first
                        const [dropIndex] = this.findDropIndexes(barCode);
                        if (dropIndex !== undefined) {
                            const {comment, signature, photo, nature_id: natureId, freeFields} = this.colisDepose[dropIndex];
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
                                movementType: 'Dépose',
                                natureTranslationLabel: this.natureTranslation.filter((translation) => translation.label === 'nature')[0].translation,
                            });
                        }
                    }
                    : undefined,
                removeItem: TracaListFactoryService.CreateRemoveItemFromListHandler(
                    this.colisDepose,
                    this.colisPrise,
                    () => {
                        this.refreshPriseListComponent();
                        this.refreshDeposeListComponent();
                    }),
                removeConfirmationMessage: 'Êtes-vous sur de vouloir supprimer cet élément ?'
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
