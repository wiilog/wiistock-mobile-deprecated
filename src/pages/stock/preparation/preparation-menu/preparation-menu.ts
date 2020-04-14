import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {Preparation} from '@app/entities/preparation';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {PreparationArticlesPage} from '@pages/stock/preparation/preparation-articles/preparation-articles';
import {MainHeaderService} from '@app/services/main-header.service';
import {CardListConfig} from "@helpers/components/card-list/card-list-config";
import {CardListColorEnum} from "@helpers/components/card-list/card-list-color.enum";


@IonicPage()
@Component({
    selector: 'page-preparation-menu',
    templateUrl: 'preparation-menu.html',
})
export class PreparationMenuPage {
    public preparations: Array<Preparation>;

    public preparationsListConfig: Array<CardListConfig>;
    public readonly preparationsListColor = CardListColorEnum.BLUE;
    public readonly preparationsIconName = 'preparation.svg';

    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private mainHeaderService: MainHeaderService,
                       private sqlLiteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqlLiteProvider.findAll('`preparation`').subscribe((preparations) => {
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
                    }
                ],
                action: () => {
                    this.navCtrl.push(PreparationArticlesPage, {preparation});
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
