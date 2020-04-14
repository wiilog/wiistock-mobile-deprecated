import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {LivraisonArticlesPage} from '@pages/stock/livraison/livraison-articles/livraison-articles';
import {Livraison} from '@app/entities/livraison';
import {MainHeaderService} from '@app/services/main-header.service';
import {CardListConfig} from '@helpers/components/card-list/card-list-config';
import {CardListColorEnum} from '@helpers/components/card-list/card-list-color.enum';


@IonicPage()
@Component({
    selector: 'page-livraison-menu',
    templateUrl: 'livraison-menu.html',
})
export class LivraisonMenuPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild(Content)
    public content: Content;

    public livraisons: Array<Livraison>;

    public livraisonsListConfig: Array<CardListConfig>;
    public readonly livraisonsListColor = CardListColorEnum.YELLOW;
    public readonly livraisonsIconName = 'delivery.svg';

    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private mainHeaderService: MainHeaderService,
                       private sqliteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`livraison`').subscribe((livraisons) => {
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
                    this.navCtrl.push(LivraisonArticlesPage, {livraison});
                }
            }));

            this.hasLoaded = true;
            this.refreshSubTitle();
            this.content.resize();
        });
    }

    public refreshSubTitle(): void {
        const preparationsLength = this.livraisons.length;
        this.mainHeaderService.emitSubTitle(`${preparationsLength === 0 ? 'Aucune' : preparationsLength} livraison${preparationsLength > 1 ? 's' : ''}`)
    }
}
