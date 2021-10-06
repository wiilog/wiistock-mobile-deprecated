import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
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

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
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
                    flatMap(() => this.sqliteService.findBy('dispatch', ['treatedStatusId IS NULL OR partial = 1']))
                )
                .subscribe((dispatches: Array<Dispatch>) => {
                    this.refreshDispatchesListConfig(dispatches);

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

    private refreshDispatchesListConfig(dispatches: Array<Dispatch>): void {
        this.dispatchesListConfig = dispatches.map(({
                                                        id,
                                                        requester,
                                                        color,
                                                        number,
                                                        startDate,
                                                        endDate,
                                                        locationFromLabel,
                                                        locationToLabel,
                                                        statusLabel,
                                                        typeLabel,
                                                        emergency
                                                    }) => ({
            title: {label: 'Demandeur', value: requester},
            customColor: color,
            content: [
                {label: 'Numéro', value: number || ''},
                {
                    label: 'Date d\'échéance',
                    value: startDate && endDate ? `Du ${startDate} au ${endDate}` : ''
                },
                {label: 'Emplacement prise', value: locationFromLabel || ''},
                {label: 'Emplacement dépose', value: locationToLabel || ''},
                {label: 'Type', value: typeLabel || ''},
                {label: 'Statut', value: statusLabel || ''},
                (emergency
                    ? {label: 'Urgence', value: emergency || ''}
                    : undefined)
            ].filter((item) => item && item.value),
            ...(emergency
                ? {
                    rightIcon: {
                        name: 'exclamation-triangle.svg',
                        color: 'danger'
                    }
                }
                : {}),
            action: () => {
                this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                    dispatchId: id
                });
            }
        }));
    }
}
