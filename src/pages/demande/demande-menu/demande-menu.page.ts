import {Component} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {merge, Subscription} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {PriseDeposeMenuPageRoutingModule} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu-routing.module';
import {PreparationMenuPageRoutingModule} from '@pages/stock/preparation/preparation-menu/preparation-menu-routing.module';
import {ManutentionMenuPageRoutingModule} from '@pages/demande/manutention/manutention-menu/manutention-menu-routing.module';
import {DemandeLivraisonMenuPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu-routing.module';


@Component({
    selector: 'wii-demande-menu',
    templateUrl: './demande-menu.page.html',
    styleUrls: ['./demande-menu.page.scss'],
})
export class DemandeMenuPage {

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;

    public constructor(private navService: NavService,
                       private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService) {
        this.avoidSync = true;
        const self = this;
        this.menuConfig = [
            {
                icon: 'people.svg',
                label: 'Manutention',
                action: () => {
                    self.navService.push(ManutentionMenuPageRoutingModule.PATH);
                }
            },
            {
                icon: 'demande.svg',
                iconColor: 'list-yellow',
                label: 'Livraison',
                action: () => {
                    self.navService.push(DemandeLivraisonMenuPageRoutingModule.PATH);
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

    public goToDepose() {
        this.navService
            .push(PriseDeposeMenuPageRoutingModule.PATH, {
                fromStock: true,
                goToDeposeDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }
}
