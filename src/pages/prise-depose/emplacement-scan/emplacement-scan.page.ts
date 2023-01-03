import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {Emplacement} from '@entities/emplacement';
import {PageComponent} from '@pages/page.component';
import {StorageService} from '@app/common/services/storage/storage.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {NetworkService} from '@app/common/services/network.service';
import {Livraison} from "@entities/livraison";

@Component({
    selector: 'wii-emplacement-scan',
    templateUrl: './emplacement-scan.page.html',
    styleUrls: ['./emplacement-scan.page.scss'],
})
export class EmplacementScanPage extends PageComponent {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public fromDepose: boolean;
    public fromStock: boolean;
    public fromEmptyRound: boolean;

    private livraisonToRedirect?: Livraison;

    public barcodeScannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public resetEmitter$: EventEmitter<void>;

    public loading: boolean;
    public isDemoMode: boolean;
    public customAction?: (location) => void;
    public finishAction?: () => void;

    public constructor(private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
        this.loading = true;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.livraisonToRedirect = this.currentNavParams.get('livraisonToRedirect') || null;
        this.storageService.getRight(StorageKeyEnum.DEMO_MODE).subscribe((isDemoMode) => {
            this.fromDepose = Boolean(this.currentNavParams.get('fromDepose'));
            this.fromStock = Boolean(this.currentNavParams.get('fromStock'));
            this.fromEmptyRound = Boolean(this.currentNavParams.get('fromEmptyRound'));
            this.customAction = this.currentNavParams.get('customAction');
            this.finishAction = this.currentNavParams.get('finishAction');
            this.loading = false;
            this.isDemoMode = isDemoMode;
            this.barcodeScannerMode = this.fromStock || !isDemoMode
                ? BarcodeScannerModeEnum.TOOL_SEARCH
                : BarcodeScannerModeEnum.TOOLS_FULL;

            this.resetEmitter$.emit();

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

    public createEmp(): void {
        this.testNetwork(() => {
            this.navService.push(NavPathEnum.NEW_EMPLACEMENT, {
                fromDepose: this.fromDepose,
                createNewEmp: (emplacement: Emplacement) => {
                    this.selectLocation(emplacement)
                }
            });
        });
    }

    public selectLocation(emplacement: Emplacement) {
        this.testNetwork(() => {
            if (this.customAction) {
                this.navService.pop().toPromise().then((_) => this.customAction(emplacement.label));
            } else {
                const nextPagePath = this.fromDepose
                    ? NavPathEnum.DEPOSE
                    : (this.fromEmptyRound
                        ? NavPathEnum.EMPTY_ROUND
                        : NavPathEnum.PRISE);
                this.navService.push(nextPagePath, {
                    emplacement,
                    articlesList: this.currentNavParams.get('articlesList'),
                    fromStockLivraison: Boolean(this.currentNavParams.get('articlesList')),
                    livraisonToRedirect: this.livraisonToRedirect,
                    fromStock: this.fromStock,
                    createTakeAndDrop: this.currentNavParams.get('createTakeAndDrop') || false,
                    finishAction: this.finishAction
                });
            }
        });
    }

    private testNetwork(callback: () => void): void {
        if (!this.fromStock || this.networkService.hasNetwork()) {
            callback();
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider un transfert de stock');
        }
    }
}
