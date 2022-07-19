import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {Emplacement} from '@entities/emplacement';
import {Livraison} from '@entities/livraison';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {of, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {PageComponent} from '@pages/page.component';
import * as moment from 'moment';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {LoadingService} from "@app/common/services/loading.service";
import {NetworkService} from '@app/common/services/network.service';
import {ApiService} from "@app/common/services/api.service";

@Component({
    selector: 'wii-livraison-emplacement',
    templateUrl: './manual-delivery-location.page.html',
    styleUrls: ['./manual-delivery-location.page.scss'],
})
export class ManualDeliveryLocationPage extends PageComponent {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public livraison: {
        type,
        comment,
        articles
    };

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    private validateIsLoading: boolean;

    public skipValidation: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private api: ApiService,
                       private networkService: NetworkService,
                       private localDataManager: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.validateIsLoading = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_MANUAL_DELIVERY).subscribe((skipValidation) => {
            this.skipValidation = skipValidation;
            this.livraison = this.currentNavParams.get('livraison');

            this.resetEmitter$.emit();

            this.panelHeaderConfig = this.createPanelHeaderConfig();

            if (this.selectItemComponent) {
                this.selectItemComponent.fireZebraScan();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(locationToTest: Emplacement): void {
        this.location = locationToTest;
        this.panelHeaderConfig = this.createPanelHeaderConfig();
        if (this.skipValidation) {
            this.validate();
        }
    }

    public validate(): void {
        if (this.networkService.hasNetwork()) {
            if (!this.validateIsLoading) {
                if (this.location && this.location.label) {
                    this.loadingService.presentLoadingWhile(
                        {
                            message: 'Envoi de la livraison en cours...',
                            event: () => {
                                this.validateIsLoading = true;
                                return this.api
                                    .requestApi(
                                        ApiService.POST_MANUAL_DEMANDE_LIVRAISON,
                                        {params: {delivery: this.livraison, location: this.location}}
                                    )
                            }
                        }
                    ).subscribe(
                        (response) => {
                            if (response.success) {
                                this.handleLivraisonSuccess();
                            } else {
                                this.handleLivraisonError(response.error);
                            }
                        },
                        (error) => {
                            this.handleLivraisonError(error);
                        });
                } else {
                    this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
                }
            } else {
                this.toastService.presentToast('Chargement en cours...');
            }
        } else {
            this.toastService.presentToast('Aucun réseau');
        }
    }

    private handleLivraisonSuccess(): void {
        this.toastService.presentToast('Livraison directe enregistrée avec succès');
        this.closeScreen();
    }

    private handleLivraisonError(error): void {
        this.validateIsLoading = false;
        this.toastService.presentToast(error);
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navService.runMultiplePop(2);
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'delivery.svg'
            }
        };
    }
}
