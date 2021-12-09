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

@Component({
    selector: 'wii-dispatch-menu',
    templateUrl: './dispatch-menu.page.html',
    styleUrls: ['./dispatch-menu.page.scss'],
})
export class DispatchMenuPage extends PageComponent {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;
    public readonly selectItemType = SelectItemTypeEnum.DISPATCH_NUMBER;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    private loadingSubscription: Subscription;

    public loading: boolean;
    public firstLaunch: boolean;

    public resetEmitter$: EventEmitter<void>;

    public dispatchesListConfig: Array<CardListConfig>;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public readonly dispatchesIconName = 'stock-transfer.svg';

    private dispatchTranslations: Translations;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
        this.firstLaunch = true;
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
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    tap(loader => loaderElement = loader),
                    flatMap(() => zip(
                        this.sqliteService.findBy('dispatch', ['treatedStatusId IS NULL OR partial = 1']),
                        this.translationService.get('acheminement')
                    ))
                )
                .subscribe(([dispatches, translations]: [Array<Dispatch>, Translations]) => {
                    this.refreshDispatchesListConfig(dispatches, translations);

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

    private refreshDispatchesListConfig(dispatches: Array<Dispatch>, translations: Translations): void {
        this.dispatchTranslations = translations;

        this.dispatchesListConfig = dispatches
            .sort(({startDate: startDate1}, {startDate: startDate2}) => {
                const momentDesiredDate1 = moment(startDate1, 'DD/MM/YYYY HH:mm:ss')
                const momentDesiredDate2 = moment(startDate2, 'DD/MM/YYYY HH:mm:ss')
                console.log(momentDesiredDate1, momentDesiredDate2, (
                    momentDesiredDate1.isBefore(momentDesiredDate2) ? -1 :
                        momentDesiredDate1.isAfter(momentDesiredDate2) ? 1 :
                            0
                ))
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
                        label: TranslationService.Translate(this.dispatchTranslations, "Emplacement prise"),
                        value: dispatch.locationFromLabel || ''
                    },
                    {
                        label: TranslationService.Translate(this.dispatchTranslations, "Emplacement dépose"),
                        value: dispatch.locationToLabel || ''
                    },
                    (dispatch.emergency
                        ? {label: 'Urgence', value: dispatch.emergency || ''}
                        : undefined)
                ].filter((item) => item && item.value),
                ...(dispatch.emergency
                    ? {
                        rightIcon: {
                            name: 'exclamation-triangle.svg',
                            color: 'danger'
                        }
                    }
                    : {}),
                action: () => {
                    this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                        dispatchId: dispatch.id
                    });
                }
            };
        });
    }
}
