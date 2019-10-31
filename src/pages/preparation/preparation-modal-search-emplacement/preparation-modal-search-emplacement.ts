import {Component} from '@angular/core';
import {IonicPage, ViewController} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';


@IonicPage()
@Component({
    selector: 'page-preparation-modal-search-emplacement',
    templateUrl: 'preparation-modal-search-emplacement.html',
})
export class PreparationModalSearchEmplacementPage {

    public emplacements: Array<Emplacement>;
    public emplacement: Emplacement;
    public filterString = "";
    public hasLoaded: boolean;
    public selectEmplacement: (emplacement) => void;

    public constructor(private sqliteProvider: SqliteProvider,
                       private view: ViewController) {
        this.hasLoaded = false;
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            this.hasLoaded = true;
        })
    }

    public onEmplacementSelected(emplacement: Emplacement): void {
        this.selectEmplacement(emplacement);
        this.closeModal();
    }

    public searchEmplacement(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements.filter(emp =>
                emp.label.toLocaleLowerCase() === this.filterString.toLocaleLowerCase() ||
                emp.label.toLocaleLowerCase().includes(this.filterString.toLocaleLowerCase()) ||
                this.filterString.toLocaleLowerCase().includes(emp.label.toLocaleLowerCase())
            );
            this.hasLoaded = true;
        })
    }

    public clearSearch(): void {
        this.filterString = "";
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            this.hasLoaded = true;
        })
    }

    public closeModal(): void {
        this.view.dismiss();
    }

}
