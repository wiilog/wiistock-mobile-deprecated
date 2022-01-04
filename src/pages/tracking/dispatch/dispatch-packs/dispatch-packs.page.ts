import {Component, ViewChild} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {filter, flatMap, map, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {DispatchPack} from '@entities/dispatch-pack';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {Nature} from '@entities/nature';
import {IconColor} from '@app/common/components/icon/icon-color';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Translations} from '@entities/translation';
import {ToastService} from '@app/common/services/toast.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TranslationService} from "@app/common/services/translations.service";

@Component({
    selector: 'wii-dispatch-packs',
    templateUrl: './dispatch-packs.page.html',
    styleUrls: ['./dispatch-packs.page.scss'],
})
export class DispatchPacksPage extends PageComponent {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public loading: boolean;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public dispatchHeaderConfig: {
        title: string;
        subtitle?: Array<string>;
        info?: string;
        transparent: boolean;
        leftIcon: IconConfig;
        rightIcon?: IconConfig;
    };

    public packsToTreatListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };
    public packsTreatedListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public readonly listBoldValues = ['code'];

    private dispatch: Dispatch;
    private dispatchPacks: Array<DispatchPack>;

    private typeHasNoPartialStatuses: boolean;

    private natureIdsToColors: {[natureId: number]: string};
    private natureIdsToLabels: {[natureId: number]: string};
    private natureTranslations: Translations;

    private loadingSubscription: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private toastService: ToastService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
        this.natureIdsToColors = {};
        this.natureIdsToLabels = {};
        this.dispatchPacks = [];
    }

    public ionViewWillEnter(): void {
        if (!this.packsToTreatListConfig || !this.packsTreatedListConfig) {
            this.loading = true;
            this.unsubscribeLoading();
            const dispatchId = this.currentNavParams.get('dispatchId');
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    tap((loader) => {
                        this.loadingElement = loader;
                    }),
                    flatMap(() => zip(
                        this.sqliteService.findOneBy('dispatch', {id: dispatchId}),
                        this.sqliteService.findBy('dispatch_pack', [`dispatchId = ${dispatchId}`]),
                        this.sqliteService.findAll('nature'),
                        this.translationService.get('natures')
                    ).pipe(
                        flatMap((data) => this.sqliteService
                            .findBy('status', [`category = 'acheminement'`, `state = 'partial'`, `typeId = ${data[0].typeId}`])
                            .pipe(map((partialStatuses) => ([...data, partialStatuses]))))
                        )
                    ),
                    filter(([dispatch]) => Boolean(dispatch))
                )
                .subscribe(([dispatch, packs, natures, natureTranslations, partialStatuses]: [Dispatch, Array<DispatchPack>, Array<Nature>, Translations, Array<any>]) => {
                    this.typeHasNoPartialStatuses = partialStatuses.length === 0;
                    this.natureIdsToColors = natures.reduce((acc, {id, color}) => ({
                        ...acc,
                        [Number(id)]: color
                    }), {});
                    this.natureIdsToLabels = natures.reduce((acc, {id, label}) => ({
                        ...acc,
                        [Number(id)]: label
                    }), {});
                    this.natureTranslations = natureTranslations;
                    this.dispatchPacks = packs.map((pack) => ({
                        ...pack,
                        treated: 0
                    }));
                    this.dispatch = dispatch;

                    this.refreshListToTreatConfig();
                    this.refreshListTreatedConfig();
                    this.refreshHeaderPanelConfigFromDispatch();

                    this.unsubscribeLoading();
                    this.loading = false;

                    this.footerScannerComponent.fireZebraScan();
                });
        }
    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    public takePack(barCode: string): void {
        const selectedIndex = this.dispatchPacks.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1) {
            const selectedItem = this.dispatchPacks[selectedIndex];
            if (selectedItem.treated) {
                this.toastService.presentToast(`Vous avez déjà traité ce colis.`);
            }
            else {
                this.dispatchPacks.splice(selectedIndex, 1);
                this.dispatchPacks.unshift(selectedItem);
                selectedItem.treated = 1;
                this.refreshListToTreatConfig();
                this.refreshListTreatedConfig();
                this.refreshHeaderPanelConfigFromDispatch();
            }
        }
        else {
            this.toastService.presentToast(`Ce colis n'est pas dans cet acheminement.`);
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loadingElement) {
            this.loadingElement.dismiss();
            this.loadingElement = undefined;
        }
    }

    private refreshHeaderPanelConfigFromDispatch(): void {
        this.translationService.get('acheminement').subscribe((dispatch) => {
            this.dispatchHeaderConfig = {
                title: `Demande N°${this.dispatch.number}`,
                subtitle: [
                    TranslationService.Translate(dispatch, 'Emplacement prise') + ' : ' + this.dispatch.locationFromLabel,
                    this.dispatch.destination ? `Destination : ${this.dispatch.destination}` : ''
                ],
                info: `Type ${this.dispatch.typeLabel}`,
                transparent: true,
                leftIcon: {
                    color: CardListColorEnum.GREEN,
                    customColor: this.dispatch.color,
                    name: 'stock-transfer.svg'
                }
            };
        });
    }

    private refreshListToTreatConfig(): void {
        const packsToTreat = this.dispatchPacks.filter(({treated, already_treated}) => (!already_treated && !treated));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = packsToTreat.length > 1 ? 's' : '';
        const hasPackToTreat = this.dispatchPacks && this.dispatchPacks.some(({treated}) => !treated);
        this.packsToTreatListConfig = {
            header: {
                title: 'À transférer',
                info: `${packsToTreat.length} objet${plural} à scanner`,
                leftIcon: {
                    name: 'download.svg',
                    color: 'list-green-light'
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToTreat
                    ? {
                        rightIcon: [
                            {
                                color: 'primary',
                                name: 'scan-photo.svg',
                                action: () => {
                                    this.footerScannerComponent.scan();
                                }
                            },
                            {
                                name: 'up.svg',
                                action: () => this.transferAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToTreat.map((pack) => ({
                ...(this.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.takePack(pack.code)
                }
            }))
        };
    }

    private refreshListTreatedConfig(): void {
        const packsTreated = this.dispatchPacks.filter(({treated, already_treated}) => (already_treated || treated));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = packsTreated.length > 1 ? 's' : '';
        this.packsTreatedListConfig = {
            header: {
                title: 'Transféré',
                info: `${packsTreated.length} objet${plural} scanné${plural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: CardListColorEnum.GREEN
                }
            },
            body: packsTreated.map((pack) => ({
                ...(this.packToListItemConfig(pack, natureTranslationCapitalized)),
                ...(
                    !pack.already_treated
                        ? {
                            pressAction: () => {
                                this.navService.push(NavPathEnum.DISPATCH_PACK_CONFIRM, {
                                    pack,
                                    dispatch: this.dispatch,
                                    natureTranslationLabel: natureTranslationCapitalized,
                                    confirmPack: (pack: DispatchPack) => this.confirmPack(pack)
                                })
                            },
                            rightIcon: {
                                name: 'trash.svg',
                                color: 'danger',
                                action: () => this.revertPack(pack.code)
                            }
                        }
                        : {}
                )
            }))
        };
    }

    private packToListItemConfig({code, quantity, natureId, lastLocation, already_treated}: DispatchPack, natureTranslation: string) {
        return {
            infos: {
                code: {
                    label: 'Colis',
                    value: code
                },
                quantity: {
                    label: 'Quantité',
                    value: `${quantity}`
                },
                nature: {
                    label: natureTranslation,
                    value: this.natureIdsToLabels[Number(natureId)]
                },
                lastLocation: {
                    label: 'Dernier emplacement',
                    value: lastLocation
                }
            },
            color: this.natureIdsToColors[Number(natureId)],
            disabled: Boolean(already_treated)
        }
    }

    private revertPack(barCode: string): void {
        const selectedIndex = this.dispatchPacks.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1
            && this.dispatchPacks[selectedIndex].treated) {
            this.dispatchPacks[selectedIndex].treated = 0;

            this.refreshListToTreatConfig();
            this.refreshListTreatedConfig();
            this.refreshHeaderPanelConfigFromDispatch();
        }
    }

    public validate(): void {
        const partialDispatch = this.dispatchPacks.filter(({treated, already_treated}) => (treated != 1 && already_treated != 1)).length > 0
        if (!partialDispatch || !this.typeHasNoPartialStatuses) {
            this.navService.push(NavPathEnum.DISPATCH_VALIDATE, {
                dispatchId: this.dispatch.id,
                dispatchPacks: this.dispatchPacks,
                afterValidate: () => {
                    this.navService.pop();
                }
            });
        }
        else {
            this.toastService.presentToast("Vous ne pouvez pas valider d'acheminement partiel.")
        }
    }

    private confirmPack({id: packIdToConfirm, natureId, quantity}: DispatchPack): void {
        const packIndexToConfirm = this.dispatchPacks.findIndex(({id}) => (id === packIdToConfirm));
        if (packIndexToConfirm > -1) {
            this.dispatchPacks[packIndexToConfirm].natureId = Number(natureId);
            this.dispatchPacks[packIndexToConfirm].quantity = Number(quantity);
            this.refreshListTreatedConfig();
        }
    }

    private transferAll(): void {
        this.dispatchPacks
            .filter(({treated}) => !treated)
            .forEach(({code}) => {
                this.takePack(code);
            });
    }
}
