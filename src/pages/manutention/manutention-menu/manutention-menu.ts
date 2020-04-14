import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController} from 'ionic-angular';
import {Manutention} from '@app/entities/manutention';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';
import {MainHeaderService} from '@app/services/main-header.service';
import {CardListConfig} from "@helpers/components/card-list/card-list-config";
import moment from "moment";
import {CardListColorEnum} from "@helpers/components/card-list/card-list-color.enum";


@IonicPage()
@Component({
    selector: 'page-manutention-menu',
    templateUrl: 'manutention-menu.html',
})
export class ManutentionMenuPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    public manutentions: Array<Manutention>;
    public manutentionsListConfig: Array<CardListConfig>;
    public readonly manutentionsListColor = CardListColorEnum.GREEN;
    public readonly manutentionsIconName = 'people.svg';

    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private mainHeaderService: MainHeaderService,
                       private sqliteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`manutention`').subscribe((manutentions) => {
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
                    this.navCtrl.push(ManutentionValidatePage, {manutention});
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
