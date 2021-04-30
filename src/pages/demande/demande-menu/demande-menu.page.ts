import {Component} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {merge, Subscription} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-demande-menu',
    templateUrl: './demande-menu.page.html',
    styleUrls: ['./demande-menu.page.scss'],
})
export class DemandeMenuPage extends PageComponent {

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;s
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

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }
}
