import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {StorageService} from '@app/common/services/storage.service';
import {Network} from '@ionic-native/network/ngx';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {Emplacement} from '@entities/emplacement';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {flatMap, tap} from 'rxjs/operators';
import {of, Subscription, zip} from 'rxjs';
import {PageComponent} from '@pages/page.component';
import {LoadingService} from '@app/common/services/loading.service';
import {TransferOrder} from '@entities/transfer-order';


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

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;
    public loader: HTMLIonLoadingElement;

    private onValidate: () => void;

    private loadingSubscription: Subscription;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private network: Network,
                       private loadingService: LoadingService,
                       private localDataManager: LocalDataManagerService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.transferOrder = this.currentNavParams.get('transferOrder');
        this.onValidate = this.currentNavParams.get('onValidate');

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
        if (location.label === this.transferOrder.destination) {
            this.location = location;
            this.panelHeaderConfig = this.createPanelHeaderConfig();
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
                        flatMap(() => this.sqliteService.update('transfer_order', {treated: 1}, [`id = ${this.transferOrder.id}`])),
                        flatMap((): any => (
                            this.network.type !== 'none'
                                ? this.localDataManager.sendFinishedProcess('transfer')
                                : of({offline: true})
                        ))
                    )
                    .subscribe(
                        ({offline, success}) => {
                            this.unsubscribeLoading();
                            if (offline) {
                                this.toastService.presentToast('Préparation sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
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
                    : `Votre transfert et ${nbPreparationsSucceed - 1} transfert${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private closeScreen(): void {
        this.navService.pop().subscribe(() => {
            this.onValidate();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; rightIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'preparation.svg'
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.validate()
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
