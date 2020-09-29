import {Component} from '@angular/core';
import {Handling} from '@entities/handling';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {HandlingValidatePageRoutingModule} from '@pages/demande/handling/handling-validate/handling-validate-routing.module';


@Component({
    selector: 'wii-handling-menu',
    templateUrl: './handling-menu.page.html',
    styleUrls: ['./handling-menu.page.scss'],
})
export class HandlingMenuPage extends PageComponent {
    public handlings: Array<Handling>;
    public handlingsListConfig: Array<CardListConfig>;
    public readonly handlingsListColor = CardListColorEnum.GREEN;
    public readonly handlingsIconName = 'people.svg';

    public hasLoaded: boolean;

    public constructor(private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteService.findAll('handling').subscribe((handlings: Array<Handling>) => {
            this.handlings = handlings;
            this.handlingsListConfig = this.handlings.map((handling) => ({
                title: {
                    label: 'Demandeur',
                    value: handling.requester
                },
                content: [
                    {
                        label: 'Numéro',
                        value: handling.number
                    },
                    {
                        label: 'Date attendue',
                        value: handling.desiredDate || ''
                    },
                    {
                        label: 'Chargement',
                        value: handling.source || ''
                    },
                    {
                        label: 'Déchargement',
                        value: handling.destination || ''
                    },
                    {
                        label: 'Objet',
                        value: handling.subject
                    },
                    {
                        label: 'Type',
                        value: handling.typeLabel
                    },
                    {
                        label: 'Urgence',
                        value: handling.emergency || ''
                    },
                ],
                ...(handling.emergency
                    ? {
                        rightIcon: {
                            name: 'exclamation-triangle.svg',
                            color: 'danger'
                        }
                    }
                    : {}),
                action: () => {
                    this.navService.push(HandlingValidatePageRoutingModule.PATH, {handling});
                }
            }));
            this.refreshSubTitle();
            this.hasLoaded = true;
        });
    }

    public refreshSubTitle(): void {
        const handlingsLength = this.handlings.length;
        this.mainHeaderService.emitSubTitle(`${handlingsLength === 0 ? 'Aucune' : handlingsLength} demande${handlingsLength > 1 ? 's' : ''}`)
    }
}
