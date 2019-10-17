import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {PreparationEmplacementPage} from "../preparation-emplacement/preparation-emplacement";
import {Preparation} from "../../../app/entities/preparation";

/**
 * Generated class for the PreparationModalSearchEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-modal-search-emplacement',
    templateUrl: 'preparation-modal-search-emplacement.html',
})
export class PreparationModalSearchEmplacementPage {

    emplacements: Array<Emplacement>;
    emplacement: Emplacement;
    filterString = "";
    preparation: Preparation;
    hasLoaded: boolean;

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public sqliteProvider: SqliteProvider,
                public view: ViewController) {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            if (typeof (navParams.get('preparation')) !== undefined) {
                this.preparation = navParams.get('preparation');
                this.hasLoaded = true;
            }
        })
    }

    selectEmplacement(emplacement: Emplacement) {
        this.emplacement = emplacement;
        this.navCtrl.setRoot(PreparationEmplacementPage, {
            preparation: this.preparation,
            emplacement: this.emplacement
        })
    }

    searchEmplacement() {
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

    clearSearch() {
        this.filterString = "";
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            this.hasLoaded = true;
        })
    }

    closeModal() {
        this.view.dismiss();
    }

}
