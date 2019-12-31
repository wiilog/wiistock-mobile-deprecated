import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController} from 'ionic-angular';
import {Manutention} from '@app/entities/manutention';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';
import {MainHeaderService} from '@app/services/main-header.service';


@IonicPage()
@Component({
    selector: 'page-manutention-menu',
    templateUrl: 'manutention-menu.html',
})
export class ManutentionMenuPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    public manutentions: Array<Manutention>;
    public hasLoaded: boolean;

    public constructor(private navCtrl: NavController,
                       private mainHeaderService: MainHeaderService,
                       private sqliteProvider: SqliteProvider) {
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`manutention`').subscribe((manutentions) => {
            this.manutentions = manutentions;
            this.refreshSubTitle();
            this.hasLoaded = true;
        });
    }

    public refreshSubTitle(): void {
        const manutentionLength = this.manutentions.length;
        this.mainHeaderService.emitSubTitle(`${manutentionLength === 0 ? 'Aucune' : manutentionLength} demande${manutentionLength > 1 ? 's' : ''}`)
    }

    public goToManut(manutention: Manutention): void {
        this.navCtrl.push(ManutentionValidatePage, {manutention});
    }

    public toDate(manutention: Manutention): Date {
        return new Date(manutention.date_attendue);
    }
}
