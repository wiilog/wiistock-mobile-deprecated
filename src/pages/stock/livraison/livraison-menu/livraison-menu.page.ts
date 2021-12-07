import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {NavService} from '@app/common/services/nav/nav.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {PageComponent} from '@pages/page.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Emplacement} from '@entities/emplacement';
import {Subscription} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {LoadingService} from '@app/common/services/loading.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


@Component({
    selector: 'wii-livraison-menu',
    templateUrl: './livraison-menu.page.html',
    styleUrls: ['./livraison-menu.page.scss'],
})
export class LivraisonMenuPage extends PageComponent {
    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SEARCH_SCAN;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public deliveryOrders: Array<Livraison>;

    public deliveryOrdersListConfig: Array<CardListConfig>;
    public readonly deliveryOrdersListColor = CardListColorEnum.YELLOW;
    public readonly deliveryOrdersIconName = 'delivery.svg';

    public hasLoaded: boolean;

    public resetEmitter$: EventEmitter<void>;
    public locationFilterRequestParams: Array<string>;

    public loader: HTMLIonLoadingElement;
    public firstLaunch: boolean;

    private loadingSubscription: Subscription;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
        this.locationFilterRequestParams = [];
        this.firstLaunch = true;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        const withoutLoading = this.currentNavParams.get('withoutLoading');
        if (!this.firstLaunch || !withoutLoading) {
            this.resetEmitter$.emit();

            this.unsubscribeLoading();
            this.loadingSubscription = this.loadingService.presentLoading()
                .pipe(
                    flatMap((loader) => (
                        this.sqliteService
                            .findAll('livraison')
                            .pipe(map((articles) => [loader, articles]))
                    ))
                )
                .subscribe(([loader, deliveries]: [HTMLIonLoadingElement, Array<Livraison>]) => {
                    this.loader = loader;
                    this.deliveryOrders = deliveries.filter(({date_end}) => (date_end === null));
                    const preparationLocationsStr = deliveries
                        .reduce((acc: Array<string>, {preparationLocation}) => {
                            if (preparationLocation && acc.indexOf(preparationLocation) === -1) {
                                acc.push(preparationLocation);
                            }
                            return acc;

                        }, [])
                        .map((label) => `'${label.replace("'", "''")}'`);

                    this.locationFilterRequestParams = preparationLocationsStr.length > 0
                        ? [`label IN (${preparationLocationsStr.join(',')})`]
                        : [];

                    this.refreshListConfig(this.deliveryOrders);
                    this.refreshSubTitle(this.deliveryOrders);

                    this.hasLoaded = true;
                    this.unsubscribeLoading();
                });
        }
        else {
            this.hasLoaded = true;
            this.firstLaunch = false;
        }
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
                    {
                        label: 'Commentaire',
                        value: livraison.comment
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
                    this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {livraison});
                }
            }));
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
