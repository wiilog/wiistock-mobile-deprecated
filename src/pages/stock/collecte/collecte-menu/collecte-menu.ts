import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {CollecteArticlesPage} from '@pages/stock/collecte/collecte-articles/collecte-articles';
import {Collecte} from '@app/entities/collecte';
import {MainHeaderService} from "@app/services/main-header.service";


@IonicPage()
@Component({
    selector: 'page-collectes-menu',
    templateUrl: 'collecte-menu.html',
})
export class CollecteMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    collectes: Array<Collecte>;
    hasLoaded: boolean;

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
            this.hasLoaded = true;
            this.refreshSubTitle();
            this.content.resize();
        });
    }

    public goToArticles(collecte): void {
        this.navCtrl.push(CollecteArticlesPage, {
            collecte,
            goToDepose: () => {
                this.avoidSync();
                this.navCtrl.pop();
                this.goToDepose();
            }
        });
    }

    public refreshSubTitle(): void {
        const collectesLength = this.collectes.length;
        this.mainHeaderService.emitSubTitle(`${collectesLength === 0 ? 'Aucune' : collectesLength} collecte${collectesLength > 1 ? 's' : ''}`)
    }
}
