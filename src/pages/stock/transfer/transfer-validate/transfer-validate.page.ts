import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {Emplacement} from '@entities/emplacement';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {flatMap, map, tap} from 'rxjs/operators';
import {of, Subscription} from 'rxjs';
import {PageComponent} from '@pages/page.component';
import {LoadingService} from '@app/common/services/loading.service';
import {TransferOrder} from '@entities/transfer-order';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {NetworkService} from '@app/common/services/network.service';


@Component({
    selector: 'wii-transfer-validate',
    templateUrl: './transfer-validate.page.html',
    styleUrls: ['./transfer-validate.page.scss'],
})
export class TransferValidatePage extends PageComponent {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public transferOrder: TransferOrder;
    public dropOnFreeLocation: boolean;
    public skipValidation: boolean;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;
    public loader: HTMLIonLoadingElement;

    private onValidate: () => void;

    private loadingSubscription: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private networkService: NetworkService,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.transferOrder = this.currentNavParams.get('transferOrder');
        this.skipValidation = this.currentNavParams.get('skipValidation');
        this.onValidate = this.currentNavParams.get('onValidate');

        this.storageService.getRight(StorageKeyEnum.PARAMETER_DROP_ON_FREE_LOCATION).subscribe((dropOnFreeLocation: boolean) => {
            this.dropOnFreeLocation = dropOnFreeLocation;
        });

        this.resetEmitter$.emit();

        this.panelHeaderConfig = this.createPanelHeaderConfig();

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location: Emplacement): void {
        if (this.dropOnFreeLocation || location.label === this.transferOrder.destination) {
            this.location = location;
            this.panelHeaderConfig = this.createPanelHeaderConfig();

            if(this.skipValidation) {
                this.validate();
            }
        }
        else {
            this.resetEmitter$.emit();
            this.toastService.presentToast(`La destination du transfert doit être l'emplacement ${this.transferOrder.destination}.`)
        }
    }

    public validate(): void {
        if (!this.loader) {
            if (this.location && this.location.label) {
                this.unsubscribeLoading();
                this.loadingSubscription = this.loadingService.presentLoading()
                    .pipe(
                        tap((loader) => {
                            this.loader = loader;
                        }),
                        flatMap(() => this.sqliteService.update('transfer_order', [{
                            values: {
                                treated: 1,
                                destination: this.location.label
                            },
                            where: [`id = ${this.transferOrder.id}`]
                        }])),
                        flatMap((): any => (
                            this.networkService.hasNetwork()
                                ? this.localDataManager.sendFinishedProcess('transfer')
                                : of({offline: true})
                        )),
                        flatMap((res: any) => (
                            res.offline || res.success.length > 0
                                ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_TRANSFERS_TREATED).pipe(map(() => res))
                                : of(res)
                        )),
                    )
                    .subscribe(
                        ({offline, success}) => {
                            this.unsubscribeLoading();
                            if (offline) {
                                this.toastService.presentToast('Transfert sauvegardé localement, nous l\'enverrons au serveur une fois la connexion internet retrouvée');
                                this.closeScreen();
                            }
                            else {
                                this.handlePreparationsSuccess(success.length);
                            }
                        },
                        () => {
                            this.toastService.presentToast('Erreur lors de la validation du transfert.');
                        });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
        else {
            this.toastService.presentToast('Chargement en cours...');
        }
    }

    private handlePreparationsSuccess(nbPreparationsSucceed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.presentToast(
                (nbPreparationsSucceed === 1
                    ? 'Votre transfert a bien été enregistré'
                    : `Votre transfert et ${nbPreparationsSucceed - 1} transfert${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrés`)
            );
        }
        this.closeScreen();
    }

    private closeScreen(): void {
        this.navService.pop().subscribe(() => {
            this.onValidate();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'preparation.svg'
            }
        };
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }

        if (this.loader) {
            this.loader.dismiss();
            this.loader = undefined;
        }
    }
}
