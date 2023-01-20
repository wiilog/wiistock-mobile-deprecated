import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {flatMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemComponent} from "@app/common/components/select-item/select-item.component";
import {ToastService} from '@app/common/services/toast.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {Translations} from '@entities/translation';
import {TranslationService} from '@app/common/services/translations.service';
import * as moment from 'moment';
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {IconColor} from "@app/common/components/icon/icon-color";

@Component({
    selector: 'wii-dispatch-grouped-signature',
    templateUrl: './dispatch-grouped-signature.page.html',
    styleUrls: ['./dispatch-grouped-signature.page.scss'],
})
export class DispatchGroupedSignaturePage extends PageComponent {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;
    public readonly selectItemType = SelectItemTypeEnum.DISPATCH_NUMBER;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    private loadingSubscription: Subscription;

    public loading: boolean;
    public firstLaunch: boolean;

    public resetEmitter$: EventEmitter<void>;

    public dispatchesListConfig: Array<CardListConfig>;
    public dispatchesToSignListConfig: Array<CardListConfig>;
    public headerFilteredDispatchs?: HeaderConfig;
    public headerDispatchsToSign?: HeaderConfig;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public dispatchesToSign: Array<Dispatch>;
    public dispatches: Array<Dispatch>;
    public dispatchTranslations: Translations;
    public labelFrom: string;
    public labelTo: string;
    public filters: {
        status?: { id: number; text: string };
        type?: { id: number; text: string };
        from?: { id: number; text: string };
        to?: { id: number; text: string };
    };

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.firstLaunch = true;
        this.filters = {
            status: null,
            type: null,
            from: null,
            to: null,
        }
    }


    public ionViewWillEnter(): void {
        this.resetEmitter$.emit();
        this.updateDispatchList();
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    private updateDispatchList(): void {
        this.loading = true;
        this.unsubscribeLoading();
        let loaderElement;

        const withoutLoading = this.currentNavParams.get('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            const filtersSQL = [];
            if (this.filters.from) {
                filtersSQL.push(`locationFromLabel = '${this.filters.from.text}'`)
            }
            if (this.filters.to) {
                filtersSQL.push(`locationToLabel = '${this.filters.to.text}'`)
            }
            if (this.filters.status) {
                filtersSQL.push(`statusId = '${this.filters.status.id}'`)
            }
            if (this.filters.type) {
                filtersSQL.push(`typeId = '${this.filters.type.id}'`)
            }
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    tap(loader => loaderElement = loader),
                    flatMap(() => zip(
                        this.sqliteService.findBy('dispatch',
                            [
                                'treatedStatusId IS NULL OR partial = 1',
                                ...filtersSQL
                            ]
                        ),
                        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`)
                    ))
                )
                .subscribe(([dispatches, translations]: [Array<Dispatch>, Translations]) => {
                    this.dispatchesToSignListConfig = [];
                    this.dispatchesListConfig = [];
                    this.dispatches = dispatches;
                    this.dispatchesToSign = [];
                    this.refreshDispatchesListConfig(translations);
                    this.refreshSubTitle();
                    this.unsubscribeLoading();
                    this.loading = false;
                    if (loaderElement) {
                        loaderElement.dismiss();
                        loaderElement = undefined;
                    }
                });
        }
        else {
            this.loading = true;
            this.firstLaunch = false;
        }
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public refreshSubTitle(): void {
        const dispatchesLength = this.dispatchesListConfig.length;
        this.mainHeaderService.emitSubTitle(`${dispatchesLength === 0 ? 'Aucune' : dispatchesLength} demande${dispatchesLength > 1 ? 's' : ''}`)
    }

    public onScanningDispatch(dispatch?: Dispatch) {
        if (dispatch) {
            this.redirectToDispatch(dispatch.id);
        }
        else {
            this.toastService.presentToast('Aucun acheminement correspondant');
        }
    }

    private redirectToDispatch(id: number) {
        this.navService.push(NavPathEnum.DISPATCH_PACKS, {
            dispatchId: id
        });
    }

    private refreshHeaders() {
        this.headerFilteredDispatchs = {
            title: `Demande filtrés`,
            subtitle: `${this.dispatches.length} demandes`,
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'stock-transfer.svg'
            },
            ...(this.dispatches.length ? {
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => {
                        this.signAll();
                    }
                }
            } : {})
        };
        this.headerDispatchsToSign = {
            title: `Sélectionnés`,
            subtitle: `${this.dispatchesToSign.length} demandes` ,
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'download.svg'
            },
        };
    }

    private refreshSingleList(attribute: string, list: Array<Dispatch>, isSelected: boolean) {
        this[attribute] = list
            .sort(({startDate: startDate1}, {startDate: startDate2}) => {
                const momentDesiredDate1 = moment(startDate1, 'DD/MM/YYYY HH:mm:ss')
                const momentDesiredDate2 = moment(startDate2, 'DD/MM/YYYY HH:mm:ss')

                if(momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return -1;
                } else if(momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return 1;
                } else if(!momentDesiredDate1.isValid() && !momentDesiredDate2.isValid()) {
                    return 0;
                }

                return (
                    momentDesiredDate1.isBefore(momentDesiredDate2) ? -1 :
                        momentDesiredDate1.isAfter(momentDesiredDate2) ? 1 :
                            0
                );
            })
            .map((dispatch: Dispatch) => {
                return {
                    title: {label: 'Demandeur', value: dispatch.requester},
                    customColor: dispatch.color,
                    content: [
                        {label: 'Numéro', value: dispatch.number || ''},
                        {label: 'Type', value: dispatch.typeLabel || ''},
                        {label: 'Statut', value: dispatch.statusLabel || ''},
                        {
                            label: `Date d'échéance`,
                            value: dispatch.startDate && dispatch.endDate ? `Du ${dispatch.startDate} au ${dispatch.endDate}` : ''
                        },
                        {
                            label: this.labelFrom,
                            value: dispatch.locationFromLabel || ''
                        },
                        {
                            label: this.labelTo,
                            value: dispatch.locationToLabel || ''
                        },
                        (dispatch.emergency
                            ? {label: 'Urgence', value: dispatch.emergency || ''}
                            : {label: 'Urgence', value: 'Non'})
                    ].filter((item) => item && item.value),
                    ...(!isSelected ? {
                        rightIcon: {
                            color: 'grey' as IconColor,
                            name: 'up.svg',
                            action: () => {
                                this.signingDispatch(dispatch);
                            }
                        }
                    } : {}),
                    action: () => {
                        // this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                        //     dispatchId: dispatch.id
                        // });
                        //TODO rediriger au détails au clic
                    }
                };
            });
    }

    private refreshDispatchesListConfig(translations: Translations): void {
        this.dispatchTranslations = translations;
        this.labelFrom = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise');
        this.labelTo = TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose');
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);
    }

    public filter() {
        this.navService.push(NavPathEnum.DISPATCH_FILTER, {
            ...this.filters,
            afterValidate: (values) => {
                this.filters = values;
                this.updateDispatchList();
            }
        })
    }

    public validateGroupedSignature(){
        if(this.filters.status && this.filters.type && (this.filters.to || this.filters.from) && this.dispatchesToSign.length > 0){
            this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE_VALIDATE, {
                dispatchesToSign: this.dispatchesToSign,
                status: this.filters.status.id,
                location: this.filters.from ? this.filters.from.id : this.filters.to.id
            });
        }
        else {
            this.toastService.presentToast('Veuillez saisir un statut, un type ainsi qu\'un emplacement de prise ou de dépose dans les filtres.');
        }
    }

    public signAll(): void{
        this.dispatchesToSign.push(...this.dispatches);
        this.dispatches = [];
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);
    }

    public signingDispatch(dispatch: Dispatch): void {
        this.dispatches.splice(this.dispatches.findIndex((dispatchIndex) => dispatchIndex.id === dispatch.id), 1);
        this.dispatchesToSign.push(dispatch);
        this.refreshHeaders();
        this.refreshSingleList('dispatchesListConfig', this.dispatches, false);
        this.refreshSingleList('dispatchesToSignListConfig', this.dispatchesToSign, true);

    }
}
