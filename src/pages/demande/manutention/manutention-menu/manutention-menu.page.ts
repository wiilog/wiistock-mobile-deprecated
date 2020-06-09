import {Component} from '@angular/core';
import * as moment from 'moment';
import {Manutention} from '@entities/manutention';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {ManutentionValidatePageRoutingModule} from '@pages/demande/manutention/manutention-validate/manutention-validate-routing.module';


@Component({
    selector: 'wii-manutention-menu',
    templateUrl: './manutention-menu.page.html',
    styleUrls: ['./manutention-menu.page.scss'],
})
export class ManutentionMenuPage {
    public manutentions: Array<Manutention>;
    public manutentionsListConfig: Array<CardListConfig>;
    public readonly manutentionsListColor = CardListColorEnum.GREEN;
    public readonly manutentionsIconName = 'people.svg';

    public hasLoaded: boolean;

    public constructor(private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private sqliteService: SqliteService) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteService.findAll('`manutention`').subscribe((manutentions) => {
            this.manutentions = manutentions;
            this.manutentionsListConfig = this.manutentions.map((manutention) => ({
                title: {
                    label: 'Demandeur',
                    value: manutention.demandeur
                },
                content: [
                    {
                        label: 'Date attendue',
                        value: manutention.date_attendue
                            ? moment(manutention.date_attendue).locale('fr').format('L h:mm')
                            : ''
                    },
                    {
                        label: 'Objet',
                        value: manutention.objet
                    }
                ],
                action: () => {
                    this.navService.push(ManutentionValidatePageRoutingModule.PATH, {manutention});
                }
            }));
            this.refreshSubTitle();
            this.hasLoaded = true;
        });
    }

    public refreshSubTitle(): void {
        const manutentionLength = this.manutentions.length;
        this.mainHeaderService.emitSubTitle(`${manutentionLength === 0 ? 'Aucune' : manutentionLength} demande${manutentionLength > 1 ? 's' : ''}`)
    }
}
