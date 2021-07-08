import {Component} from '@angular/core';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {TransferOrder} from '@entities/transfer-order';
import {Subscription} from 'rxjs';
import {LoadingService} from '@app/common/services/loading.service';
import {flatMap, map} from 'rxjs/operators';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-transfer-list',
    templateUrl: './transfer-list.page.html',
    styleUrls: ['./transfer-list.page.scss'],
})
export class TransferListPage extends PageComponent {
    public hasLoaded: boolean;

    public transfersListConfig: Array<CardListConfig>;
    public readonly transfersListColor = CardListColorEnum.TERTIARY;
    public readonly transfersIconName = 'transfer.svg';

    private loadingSubscription: Subscription;
    private loader: HTMLIonLoadingElement;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.unsubscribeLoading();

        const withoutLoading = this.currentNavParams.get('withoutLoading');
        if (!withoutLoading) {
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    flatMap((loader) => (
                        this.sqliteService
                            .findBy('transfer_order', ['treated <> 1'])
                            .pipe(map((transferOrders) => [loader, transferOrders]))
                    ))
                )
                .subscribe(([loader, transferOrders]: [HTMLIonLoadingElement, Array<TransferOrder>]) => {
                    this.loader = loader;
                    this.transfersListConfig = transferOrders.map((transferOrder: TransferOrder) => ({
                        title: {
                            label: 'Demandeur',
                            value: transferOrder.requester
                        },
                        content: [
                            {
                                label: 'Numéro',
                                value: transferOrder.number
                            },
                            {
                                label: 'Origine',
                                value: transferOrder.origin
                            },
                            {
                                label: 'Destination',
                                value: transferOrder.destination
                            }
                        ],
                        action: () => {
                            this.navService.push(NavPathEnum.TRANSFER_ARTICLES, {transferOrder});
                        }
                    }));

                    this.hasLoaded = true;
                    const transferOrdersLength = transferOrders.length;
                    this.mainHeaderService.emitSubTitle(`${transferOrdersLength === 0 ? 'Aucun' : transferOrdersLength} transfert${transferOrdersLength > 1 ? 's' : ''}`);

                    this.unsubscribeLoading();
                });
        }
        else {
            this.hasLoaded = true;
        }
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
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
