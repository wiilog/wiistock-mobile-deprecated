import {Component} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {merge, Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav/nav.service';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NetworkService} from '@app/common/services/network.service';


@Component({
    selector: 'wii-demande-menu',
    templateUrl: './demande-menu.page.html',
    styleUrls: ['./demande-menu.page.scss'],
})
export class DemandeMenuPage extends PageComponent {

    public readonly menuConfig: Array<MenuConfig>;
    public statsSlidersData: Array<StatsSlidersData>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private networkService: NetworkService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.avoidSync = true;
        const self = this;
        this.menuConfig = [
            {
                icon: 'people.svg',
                label: 'Service',
                action: () => {
                    self.navService.push(NavPathEnum.HANDLING_MENU);
                }
            },
            {
                icon: 'demande.svg',
                iconColor: 'list-yellow',
                label: 'Livraison',
                action: () => {
                    self.navService.push(NavPathEnum.DEMANDE_LIVRAISON_MENU);
                }
            },
            {
                icon: 'transfer.svg',
                iconColor: 'list-blue',
                label: 'Acheminement',
                action: () => {
                    self.navService.push(NavPathEnum.DISPATCH_REQUEST_MENU);
                }
            }
        ];
    }

    public ionViewWillEnter(): void {
        this.navigationSubscription = merge(
            this.mainHeaderService.navigationChange$,
            this.platform.backButton
        )
            .subscribe(() => {
                this.setAvoidSync(true);
            });

        if (!this.avoidSync) {
            this.synchronise();
        }
        else {
            this.setAvoidSync(false);
        }

        zip(
            this.storageService.getCounter(StorageKeyEnum.COUNTERS_HANDLINGS_TREATED),
            this.sqliteService.count('handling')
        ).subscribe(
            ([treatedHandlings, toTreatDispatches]) => {
                this.statsSlidersData = this.createStatsSlidersData(treatedHandlings, toTreatDispatches);
            }
        )
    }

    public ionViewWillLeave(): void {
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
            this.navigationSubscription = undefined;
        }
    }

    public synchronise(): void {
        if (this.networkService.hasNetwork()) {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe(
                ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                },
                (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
                });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }

    private createStatsSlidersData(treatedHandlingsCounter: number,
                                   toTreatedHandlingsCounter: number): Array<StatsSlidersData> {
        const sTreatedHandlings = treatedHandlingsCounter > 1 ? 's' : '';
        const sToTreatedHandlings = toTreatedHandlingsCounter > 1 ? 's' : '';
        return [
            { label: `Service${sToTreatedHandlings} à traiter`, counter: toTreatedHandlingsCounter },
            { label: `Service${sTreatedHandlings} traité${sTreatedHandlings}`, counter: treatedHandlingsCounter }
        ];
    }
}
