import {Component} from '@angular/core';
import {merge, Subscription} from 'rxjs';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

@Component({
    selector: 'wii-stock-menu',
    templateUrl: './stock-menu.page.html',
    styleUrls: ['./stock-menu.page.scss'],
})
export class StockMenuPage extends PageComponent {

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.avoidSync = true;
        const self = this;
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Transfert',
                action: () => {
                    self.navService.push(NavPathEnum.TRANSFER_MENU);
                }
            },
            {
                icon: 'preparation.svg',
                label: 'Préparation',
                action: () => {
                    self.navService.push(NavPathEnum.PREPARATION_MENU);
                }
            },
            {
                icon: 'delivery.svg',
                label: 'Livraison',
                action: () => {
                    self.navService.push(NavPathEnum.LIVRAISON_MENU);
                }
            },
            {
                icon: 'collecte.svg',
                label: 'Collecte',
                action: () => {
                    this.navService.push(NavPathEnum.COLLECTE_MENU, {
                        avoidSync: () => {
                            self.setAvoidSync(true);
                        },
                        goToDrop: () => {
                            self.goToDrop();
                        }
                    });
                }
            },
            {
                icon: 'inventory.svg',
                label: 'Inventaire',
                action: () => {
                    self.navService.push(NavPathEnum.INVENTORY_LOCATIONS);
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
        if (this.network.type !== 'none') {
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

    public goToDrop() {
        this.navService
            .push(NavPathEnum.TRANSFER_MENU, {
                goToDropDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }
}
