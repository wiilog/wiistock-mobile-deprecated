import {Component} from '@angular/core';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {Preparation} from '@entities/preparation';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {NavService} from '@app/common/services/nav.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {PreparationArticlesPageRoutingModule} from '@pages/stock/preparation/preparation-articles/preparation-articles-routing.module';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-preparation-menu',
    templateUrl: './preparation-menu.page.html',
    styleUrls: ['./preparation-menu.page.scss'],
})
export class PreparationMenuPage extends PageComponent {
    public preparations: Array<Preparation>;

    public preparationsListConfig: Array<CardListConfig>;
    public readonly preparationsListColor = CardListColorEnum.BLUE;
    public readonly preparationsIconName = 'preparation.svg';

    public hasLoaded: boolean;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqlLiteProvider: SqliteService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqlLiteProvider.findAll('preparation').subscribe((preparations) => {
            this.preparations = preparations
                .filter(p => (p.date_end === null))
                .sort(({type : type1}, {type : type2}) => (type1 > type2) ? 1 : ((type2 > type1) ? -1 : 0));

            this.preparationsListConfig = this.preparations.map((preparation: Preparation) => ({
                title: {
                    label: 'Demandeur',
                    value: preparation.requester
                },
                content: [
                    {
                        label: 'Numéro',
                        value: preparation.numero
                    },
                    {
                        label: 'Flux',
                        value: preparation.type
                    },
                    {
                        label: 'Destination',
                        value: preparation.destination
                    },
                    {
                        label: 'Commentaire',
                        value: preparation.comment
                    }
                ],
                action: () => {
                    this.navService.push(PreparationArticlesPageRoutingModule.PATH, {preparation});
                }
            }));

            this.hasLoaded = true;
            this.refreshSubTitle();
        });
    }

    public refreshSubTitle(): void {
        const preparationsLength = this.preparations.length;
        this.mainHeaderService.emitSubTitle(`${preparationsLength === 0 ? 'Aucune' : preparationsLength} préparation${preparationsLength > 1 ? 's' : ''}`)
    }
}
