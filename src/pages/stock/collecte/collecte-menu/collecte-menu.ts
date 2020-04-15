import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {CollecteArticlesPage} from '@pages/stock/collecte/collecte-articles/collecte-articles';
import {Collecte} from '@app/entities/collecte';
import {MainHeaderService} from '@app/services/main-header.service';
import {CardListConfig} from '@helpers/components/card-list/card-list-config';
import {CardListColorEnum} from '@helpers/components/card-list/card-list-color.enum';


@IonicPage()
@Component({
    selector: 'page-collectes-menu',
    templateUrl: 'collecte-menu.html',
})
export class CollecteMenuPage {
    public hasLoaded: boolean;

    public collectes: Array<Collecte>;

    public collectesListConfig: Array<CardListConfig>;
    public readonly collectesListColor = CardListColorEnum.ORANGE;
    public readonly collectesIconName = 'collecte.svg';

    private goToDepose: () => void;
    private avoidSync: () => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private mainHeaderService: MainHeaderService,
                       private sqlLiteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.goToDepose = this.navParams.get('goToDepose');
        this.avoidSync = this.navParams.get('avoidSync');
        this.sqlLiteProvider.findAll('`collecte`').subscribe((collectes: Array<Collecte>) => {
            this.collectes = collectes
                .filter(({date_end, location_to}) => (!date_end && !location_to))
                .sort(({location_from: location_from_1}, {location_from: location_from_2}) => ((location_from_1 < location_from_2) ? -1 : 1));

            this.collectesListConfig = this.collectes.map((collecte: Collecte) => ({
                title: {
                    label: 'Demandeur',
                    value: collecte.requester
                },
                content: [
                    {
                        label: 'Numéro',
                        value: collecte.number
                    },
                    {
                        label: 'Flux',
                        value: collecte.type
                    },
                    {
                        label: 'Point de collecte',
                        value: collecte.location_from
                    },
                    {
                        label: 'Destination',
                        value: (collecte.forStock ? 'Mise en stock' : 'Destruction')
                    }
                ],
                action: () => {
                    const self = this;
                    self.navCtrl.push(CollecteArticlesPage, {
                        collecte,
                        goToDepose: () => {
                            self.avoidSync();
                            self.navCtrl.pop();
                            self.goToDepose();
                        }
                    });
                }
            }));

            this.hasLoaded = true;
            this.refreshSubTitle();
        });
    }
    public refreshSubTitle(): void {
        const collectesLength = this.collectes.length;
        this.mainHeaderService.emitSubTitle(`${collectesLength === 0 ? 'Aucune' : collectesLength} collecte${collectesLength > 1 ? 's' : ''}`)
    }
}
