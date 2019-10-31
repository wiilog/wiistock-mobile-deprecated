import {Component} from '@angular/core';
import {IonicPage, NavParams, ViewController} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';

@IonicPage()
@Component({
    selector: 'page-collecte-modal-search-emplacement',
    templateUrl: 'collecte-modal-search-emplacement.html',
})
export class CollecteModalSearchEmplacementPage {

    public emplacements: Array<Emplacement>;
    public filterString = "";
    public hasLoaded: boolean;

    private selectEmplacement: (emplacement: Emplacement) => void;

    public constructor(private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private view: ViewController) {
        this.showLoading();
    }

    public ionViewWillEnter(): void {
        this.selectEmplacement = this.navParams.get('selectEmplacement');
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            this.hideLoading();
        })
    }

    public onEmplacementSelected(emplacement: Emplacement): void {
        this.selectEmplacement(emplacement);
        this.closeModal();
    }

    public searchEmplacement(): void {
        this.showLoading();
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements.filter(emp =>
                emp.label.toLocaleLowerCase() === this.filterString.toLocaleLowerCase() ||
                emp.label.toLocaleLowerCase().includes(this.filterString.toLocaleLowerCase()) ||
                this.filterString.toLocaleLowerCase().includes(emp.label.toLocaleLowerCase())
            );
            this.hideLoading();
        })
    }

    public clearSearch(): void {
        this.filterString = "";
        this.showLoading();
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            this.hideLoading();
        })
    }

    public closeModal(): void {
        this.view.dismiss();
    }

    private showLoading(): void {
        this.hasLoaded = false;
    }

    private hideLoading(): void {
        this.hasLoaded = true;
    }

}
