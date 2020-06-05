import {Component} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {NavService} from '@app/common/services/nav.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite.service';
import {LivraisonArticlesPageRoutingModule} from '@pages/stock/livraison/livraison-articles/livraison-articles-routing.module';

@Component({
    selector: 'wii-livraison-menu',
    templateUrl: './livraison-menu.page.html',
    styleUrls: ['./livraison-menu.page.scss'],
})
export class LivraisonMenuPage {
    public livraisons: Array<Livraison>;

    public livraisonsListConfig: Array<CardListConfig>;
    public readonly livraisonsListColor = CardListColorEnum.YELLOW;
    public readonly livraisonsIconName = 'delivery.svg';

    public hasLoaded: boolean;

    public constructor(private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteService.findAll('`livraison`').subscribe((livraisons) => {
            this.livraisons = livraisons.filter(({date_end}) => (date_end === null));
            this.livraisonsListConfig = this.livraisons.map((livraison: Livraison) => ({
                title: {
                    label: 'Demandeur',
                    value: livraison.requester
                },
                content: [
                    {
                        label: 'Numéro',
                        value: livraison.numero
                    },
                    {
                        label: 'Flux',
                        value: livraison.type
                    },
                    {
                        label: 'Destination',
                        value: livraison.emplacement
                    }
                ],
                action: () => {
                    this.navService.push(LivraisonArticlesPageRoutingModule.PATH, {livraison});
                }
            }));

            this.hasLoaded = true;
            this.refreshSubTitle();
        });
    }

    public refreshSubTitle(): void {
        const preparationsLength = this.livraisons.length;
        this.mainHeaderService.emitSubTitle(`${preparationsLength === 0 ? 'Aucune' : preparationsLength} livraison${preparationsLength > 1 ? 's' : ''}`)
    }
}
