import {Component} from '@angular/core';
import {Subscription, zip} from 'rxjs';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {flatMap, tap} from 'rxjs/operators';
import {Dispatch} from '@entities/dispatch';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';

@Component({
    selector: 'wii-dispatch-menu',
    templateUrl: './dispatch-menu.page.html',
    styleUrls: ['./dispatch-menu.page.scss'],
})
export class DispatchMenuPage extends PageComponent {

    private loadingSubscription: Subscription;

    public loading: boolean;

    public dispatchesListConfig: Array<CardListConfig>;
    public readonly dispatchesListColor = CardListColorEnum.GREEN;
    public readonly dispatchesIconName = 'stock-transfer.svg';

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
    }


    public ionViewWillEnter(): void {
        this.loading = true;
        this.unsubscribeLoading();
        let loaderElement;
        this.loadingSubscription = this.loadingService.presentLoading()
            .pipe(
                tap((loader) => {
                    loaderElement = loader;
                }),
                flatMap(() => this.sqliteService.findAll('dispatch'))
            )
            .subscribe((dispatches: Array<Dispatch>) => {
                this.dispatchesListConfig = dispatches.map(({requester,  number, startDate, endDate, locationFromLabel, locationToLabel, statusLabel, typeLabel, urgent}) => ({
                    title: { label: 'Demandeur', value: requester },
                    content: [
                        { label: 'Numéro', value: number || '' },
                        { label: 'Date d\'échéance', value: startDate && endDate ? `Du ${startDate} au ${endDate}` : '' },
                        { label: 'Lieu départ', value: locationFromLabel || '' },
                        { label: 'Lieu arrivée', value: locationToLabel || '' },
                        { label: 'Type', value: typeLabel || '' },
                        { label: 'Statut', value: statusLabel || '' }
                    ],
                    ...(urgent
                        ? {
                            rightIcon: {
                                name: 'exclamation-triangle.svg',
                                color: 'danger'
                            }
                        }
                        : {}),
                    action: () => {
                        // this.navService.push(ManutentionValidatePageRoutingModule.PATH, {manutention});
                    }
                }));

                this.refreshSubTitle();
                this.unsubscribeLoading();
                this.loading = false;
                if (loaderElement) {
                    loaderElement.dismiss();
                    loaderElement = undefined;
                }
            });
    }


    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
    }

    private unsubscribeLoading(): void {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    public refreshSubTitle(): void {
        const dispatchesLength = this.dispatchesListConfig.length;
        this.mainHeaderService.emitSubTitle(`${dispatchesLength === 0 ? 'Aucune' : dispatchesLength} demande${dispatchesLength > 1 ? 's' : ''}`)
    }
}
