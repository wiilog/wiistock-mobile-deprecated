import {Component} from '@angular/core';
import {merge, Subscription} from 'rxjs';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {ManualTransferMenuPageRoutingModule} from '@pages/transfer/manual-transfer/manual-transfer-menu-routing.module';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-stock-menu',
    templateUrl: './transfer-menu.page.html',
    styleUrls: ['./transfer-menu.page.scss'],
})
export class TransferMenuPage extends PageComponent {

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
                icon: 'transfer.svg',
                iconColor: 'tertiary',
                label: 'Transfert à traiter',
                action: () => {
                    //TODO: add transfer module
                }
            },
            {
                icon: 'stock-transfer.svg',
                iconColor: 'success',
                label: 'Transfert manuel',
                action: () => {
                    this.navService.push(ManualTransferMenuPageRoutingModule.PATH, {
                        avoidSync: () => {
                            self.setAvoidSync(true);
                        },
                        goToDepose: () => {
                            self.goToDepose();
                        }
                    });
                }
            },
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

    public goToDepose() {
        this.navService
            .push(ManualTransferMenuPageRoutingModule.PATH, {
                fromStock: true,
                goToDeposeDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }
}
