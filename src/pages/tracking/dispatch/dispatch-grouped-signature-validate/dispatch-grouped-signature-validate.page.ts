import {Component} from '@angular/core';
import {of, Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {flatMap, map, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {Status} from '@entities/status';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {NetworkService} from '@app/common/services/network.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {TabConfig} from "@app/common/components/tab/tab-config";
import {SigningMode} from "../../../../enums/signing-mode.enum";

@Component({
    selector: 'wii-dispatch-grouped-signature-validate',
    templateUrl: './dispatch-grouped-signature-validate.page.html',
    styleUrls: ['./dispatch-grouped-signature-validate.page.scss'],
})
export class DispatchGroupedSignatureValidatePage extends PageComponent {

    public statusRequestParams;

    public loading: boolean;

    private loadingSubscription: Subscription;
    private loadingElement?: HTMLIonLoadingElement;

    private afterValidate: () => void;

    public statusHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public selectedStatus: Status;
    public type: number;
    private dispatchs?: Array<Dispatch>;
    public statuses: Array<Status> = [];
    public process?: SigningMode;
    public needsChoice: boolean;
    public from?: {
        id: number,
        text: string
    };
    public to?: {
        id: number,
        text: string
    };

    public tabConfig: TabConfig[] = [
        { label: 'Enlèvement', key: SigningMode.PICK },
        { label: 'Livraison', key: SigningMode.DROP },
    ];

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private networkService: NetworkService,
                       navService: NavService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        this.loading = true;
        this.unsubscribeLoading();
        this.afterValidate = this.currentNavParams.get('afterValidate');
        this.dispatchs = this.currentNavParams.get('dispatchesToSign');
        this.from = this.currentNavParams.get('from');
        this.to = this.currentNavParams.get('to');
        this.type = this.currentNavParams.get('type');
        this.process = this.currentNavParams.get('process');
        this.needsChoice = !this.process;

        // this.sqliteService.findOneById('status', this.currentNavParams.get('status'))
        //     .subscribe((status?: Status) => {
        //
        // });

        this.statusRequestParams = [
            `state = 'treated' OR state = 'partial'`,
            `category = 'acheminement'`,
            `typeId = ${this.type}`,
        ];
        this.loadingSubscription = this.loadingService.presentLoading()
            .pipe(
                tap((loader) => {
                    this.loadingElement = loader;
                }),
                flatMap(() => zip(
                    this.sqliteService.findBy('status', this.statusRequestParams)
                )),
            )
            .subscribe(([statuses]: [Array<any>]) => {
                this.statuses = statuses;
                this.refreshStatusHeaderConfig();

                this.unsubscribeLoading();
                this.loading = false;
            });

    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
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

    private refreshStatusHeaderConfig(): void {
        this.statusHeaderConfig = {
            title: 'Statut sélectionné',
            subtitle: this.selectedStatus && this.selectedStatus.label,
            ...(this.createHeaderConfig())
        };
    }

    private createHeaderConfig(): { leftIcon: IconConfig; transparent: boolean;} {
        return {
            transparent: true,
            leftIcon: {
                name: 'stock-transfer.svg',
                color: CardListColorEnum.GREEN,
            }
        };
    }

    public validate() {
        if (this.selectedStatus) {
            if (this.process) {
                this.navService.push(NavPathEnum.DISPATCH_GROUPED_SIGNATURE_FINISH, {
                    dispatches: this.dispatchs,
                    status: this.selectedStatus,
                    location: this.process === SigningMode.DROP ? this.to.id : this.from.id,
                    process: this.process
                })
            } else {
                this.toastService.presentToast('Veuillez selectionner un type de signature en bas de page.');
            }
        }
        else {
            this.toastService.presentToast('Vous devez sélectionner un statut.');
        }
    }
}
