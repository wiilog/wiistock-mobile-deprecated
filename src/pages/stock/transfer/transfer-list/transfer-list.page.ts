import {Component} from '@angular/core';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {TransferOrder} from '@entities/transfer-order';


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
    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteService.findAll('transfer_order').subscribe((transferOrders: Array<TransferOrder>) => {
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
                        label: 'Destination',
                        value: transferOrder.destination
                    }
                ],
                action: () => {
                    // TODO
                }
            }));

            this.hasLoaded = true;
            const transferOrdersLength = transferOrders.length;
            this.mainHeaderService.emitSubTitle(`${transferOrdersLength === 0 ? 'Aucun' : transferOrdersLength} transfert${transferOrdersLength > 1 ? 's' : ''}`);
        });
    }
}
