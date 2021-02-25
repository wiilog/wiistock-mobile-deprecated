import {Component, ViewChild} from '@angular/core';
import {of, Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {filter, flatMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Emplacement} from '@entities/emplacement';
import {Status} from '@entities/status';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {DispatchPack} from '@entities/dispatch-pack';
import {Network} from "@ionic-native/network/ngx";

enum Page {
    LOCATION,
    STATUS
}

@Component({
    selector: 'wii-dispatch-validate',
    templateUrl: './dispatch-validate.page.html',
    styleUrls: ['./dispatch-validate.page.scss'],
})
export class DispatchValidatePage extends PageComponent {

    public currentPage: Page = Page.LOCATION;
    public readonly PageLocation: Page = Page.LOCATION;
    public readonly PageStatus: Page = Page.STATUS;

    public readonly selectItemStatus = SelectItemTypeEnum.STATUS;
    public readonly selectItemLocation = SelectItemTypeEnum.LOCATION;
    public readonly barcodeScannerLocationMode = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly barcodeScannerStatusMode = BarcodeScannerModeEnum.ONLY_SEARCH;

    public statusRequestParams;

    @ViewChild('locationSelectItemComponent', {static: false})
    public locationSelectItemComponent: SelectItemComponent;

    @ViewChild('statusSelectItemComponent', {static: false})
    public statusSelectItemComponent: SelectItemComponent;

    public loading: boolean;

    private loadingSubscription: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private afterValidate: () => void;

    public locationHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    public statusHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    private selectedLocation: Emplacement;
    private selectedStatus: Status;
    private dispatch: Dispatch;
    private dispatchPacks: Array<DispatchPack>;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private network: Network,
                       navService: NavService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        this.loading = true;
        this.unsubscribeLoading();
        const dispatchId = this.currentNavParams.get('dispatchId');
        this.dispatchPacks = this.currentNavParams.get('dispatchPacks') || [];
        const treatedDispatchPacks = this.dispatchPacks.filter(({treated, already_treated}) => (treated || already_treated));
        const partial = (treatedDispatchPacks.length < this.dispatchPacks.length);
        this.afterValidate = this.currentNavParams.get('afterValidate');

        this.loadingSubscription = this.loadingService.presentLoading()
            .pipe(
                tap((loader) => {
                    this.loadingElement = loader;
                }),
                flatMap(() => this.sqliteService.findOneBy('dispatch', {id: dispatchId})),
                filter((dispatch) => Boolean(dispatch))
            )
            .subscribe((dispatch: Dispatch) => {
                this.dispatch = dispatch;
                this.statusRequestParams = [
                    `state = '${partial ? 'partial' : 'treated'}'`,
                    `category = 'acheminement'`,
                    `typeId = ${this.dispatch.typeId}`
                ];

                this.refreshLocationHeaderConfig();
                this.refreshStatusHeaderConfig();

                this.unsubscribeLoading();
                this.loading = false;

                this.locationSelectItemComponent.fireZebraScan();

                setTimeout(() => {
                    this.statusSelectItemComponent.searchComponent.reload();
                })
            });
    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        this.locationSelectItemComponent.unsubscribeZebraScan();
    }

    public selectLocation(location: Emplacement): void {
        if (this.dispatch.locationToLabel === location.label) {
            this.selectedLocation = location;
            this.refreshLocationHeaderConfig();
        }
        else {
            this.toastService.presentToast(`Erreur : l'emplacement de dépose doit être : ${this.dispatch.locationToLabel}.`);
        }
    }

    public selectStatus(status: Status): void {
        this.selectedStatus = status;
        this.refreshStatusHeaderConfig();
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

    private refreshLocationHeaderConfig(): void {
        this.locationHeaderConfig = {
            title: 'Emplacement sélectionné',
            subtitle: this.selectedLocation && this.selectedLocation.label,
            ...(this.createHeaderConfig())
        };
    }

    private refreshStatusHeaderConfig(): void {
        this.statusHeaderConfig = {
            title: 'Statut sélectionné',
            subtitle: this.selectedStatus && this.selectedStatus.label,
            ...(this.createHeaderConfig())
        };
    }

    private createHeaderConfig(): { leftIcon: IconConfig; rightIcon: IconConfig; transparent: boolean;} {
        return {
            transparent: true,
            leftIcon: {
                name: 'stock-transfer.svg',
                color: CardListColorEnum.GREEN,
                customColor: this.dispatch.color
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.validate()
            }
        };
    }

    private validate() {
        if (this.currentPage === this.PageLocation) {
            if (this.selectedLocation) {
                this.currentPage = this.PageStatus;
                this.locationSelectItemComponent.unsubscribeZebraScan();
            }
            else {
                this.toastService.presentToast('Vous devez sélectionner un emplacement.');
            }
        }
        else { // (this.currentPage === this.PageStatus)
            if (this.selectedStatus) {
                const treatedDispatchPacks = this.dispatchPacks.filter(({treated, already_treated}) => (treated || already_treated));

                this.loadingSubscription = this.loadingService.presentLoading()
                    .pipe(
                        tap((loader) => {
                            this.loadingElement = loader;
                        }),
                        flatMap(() => zip(
                            this.sqliteService.update(
                                'dispatch',
                                {treatedStatusId: this.selectedStatus.id, partial: Number(treatedDispatchPacks.length < this.dispatchPacks.length)},
                                [`id = ${this.dispatch.id}`]
                            ),
                            ...(treatedDispatchPacks
                                .map(({id, natureId, quantity, treated}) => this.sqliteService.update(
                                    'dispatch_pack',
                                    {natureId, quantity, treated},
                                    [`id = ${id}`]
                                )))
                        )),
                        flatMap((): any => (
                            this.network.type !== 'none'
                                ? this.localDataManager.sendFinishedProcess('dispatch')
                                : of({offline: true})
                        )),
                        flatMap(({offline, success}) => {
                            if (!offline) {
                                this.toastService.presentToast(success ? "L'acheminement a bien été traité." : "L'acheminement n'a pas pu être traité.");
                            }
                            return this.navService.pop();
                        })
                    )
                    .subscribe(() => {
                        this.afterValidate();
                    })
            }
            else {
                this.toastService.presentToast('Vous devez sélectionner un statut.');
            }
        }
    }
}
