import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {NavService} from '@app/common/services/nav.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LivraisonArticlesPageRoutingModule} from '@pages/stock/livraison/livraison-articles/livraison-articles-routing.module';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Emplacement} from '@entities/emplacement';

@Component({
    selector: 'wii-livraison-menu',
    templateUrl: './livraison-menu.page.html',
    styleUrls: ['./livraison-menu.page.scss'],
})
export class LivraisonMenuPage extends PageComponent {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH_AND_LABEL;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public deliveryOrders: Array<Livraison>;

    public deliveryOrdersListConfig: Array<CardListConfig>;
    public readonly deliveryOrdersListColor = CardListColorEnum.YELLOW;
    public readonly deliveryOrdersIconName = 'delivery.svg';

    public hasLoaded: boolean;

    public resetEmitter$: EventEmitter<void>;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.resetEmitter$.emit();

        this.sqliteService.findAll('livraison').subscribe((livraisons) => {
            this.deliveryOrders = livraisons.filter(({date_end}) => (date_end === null));
            this.refreshListConfig(this.deliveryOrders);

            if (this.selectItemComponent) {
                this.selectItemComponent.fireZebraScan();
            }

            this.hasLoaded = true;
            this.refreshSubTitle(this.deliveryOrders);
        });
    }

    public refreshSubTitle(deliveryOrders: Array<Livraison>): void {
        const deliveryOrdersLength = deliveryOrders.length;
        this.mainHeaderService.emitSubTitle(`${deliveryOrdersLength === 0 ? 'Aucune' : deliveryOrdersLength} livraison${deliveryOrdersLength > 1 ? 's' : ''}`)
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public filterByLocation(location?: Emplacement) {
        const deliveryOrdersToDisplay = this.deliveryOrders.filter(({preparationLocation}) => (
            !location || (location.label === preparationLocation)
        ))
        this.refreshListConfig(deliveryOrdersToDisplay);
        this.refreshSubTitle(deliveryOrdersToDisplay);
    }

    public refreshListConfig(deliveryOrders: Array<Livraison>): void {
        this.deliveryOrdersListConfig = deliveryOrders
            .map((livraison: Livraison) => ({
                title: {
                    label: 'Demandeur',
                    value: livraison.requester
                },
                content: [
                    {
                        label: 'Numéro',
                        value: livraison.number
                    },
                    {
                        label: 'Flux',
                        value: livraison.type
                    },
                    {
                        label: 'Destination',
                        value: livraison.location
                    },
                    ...(
                        livraison.preparationLocation
                            ? [{
                                label: 'Emplacement de préparation',
                                value: livraison.preparationLocation
                            }]
                            : []
                    )
                ],
                action: () => {
                    this.navService.push(LivraisonArticlesPageRoutingModule.PATH, {livraison});
                }
            }));
    }
}
