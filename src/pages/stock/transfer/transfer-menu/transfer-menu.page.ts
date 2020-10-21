import {Component} from '@angular/core';
import {Subscription} from 'rxjs';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {Platform} from '@ionic/angular';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {Network} from '@ionic-native/network/ngx';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {PriseDeposeMenuPageRoutingModule} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu-routing.module';
import {PageComponent} from '@pages/page.component';
import {TransferListPageRoutingModule} from '@pages/stock/transfer/transfer-list/transfer-list-routing.module';

@Component({
    selector: 'wii-transfer-menu',
    templateUrl: './transfer-menu.page.html',
    styleUrls: ['./transfer-menu.page.scss'],
})
export class TransferMenuPage extends PageComponent {

    public readonly menuConfig: Array<MenuConfig>;

    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;
    private deposeAlreadyNavigate: boolean;

    public constructor(private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
        this.menuConfig = [
            {
                icon: 'transfer.svg',
                iconColor: 'tertiary',
                label: 'Transfert à traiter',
                action: () => {
                    this.navService.push(TransferListPageRoutingModule.PATH);
                }
            },
            {
                icon: 'stock-transfer.svg',
                iconColor: 'success',
                label: 'Transfert manuel',
                action: () => {
                    this.navigateToPriseDeposePage();
                }
            },
        ];
    }

    public ionViewWillEnter(): void {
        const goToDropDirectly = (!this.deposeAlreadyNavigate && Boolean(this.currentNavParams.get('goToDropDirectly')));

        if (goToDropDirectly) {
            this.deposeAlreadyNavigate = true;
            this.navigateToPriseDeposePage(true);
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

    public navigateToPriseDeposePage(goToDropDirectly: boolean = false): void {
        this.navService
            .push(PriseDeposeMenuPageRoutingModule.PATH, {
                fromStock: true,
                goToDropDirectly
            });
    }
}
