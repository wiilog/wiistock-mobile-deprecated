import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import { CollecteEmplacementPage } from "../collecte-emplacement/collecte-emplacement";
import { Collecte } from "../../../app/entities/collecte";

/**
 * Generated class for the LivraisonModalSearchEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-collecte-modal-search-emplacement',
    templateUrl: 'collecte-modal-search-emplacement.html',
})
export class CollecteModalSearchEmplacementPage {

    emplacements: Array<Emplacement>;
    emplacement: Emplacement;
    filterString = "";
    collecte: Collecte;
    hasLoaded: boolean;

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public sqliteProvider: SqliteProvider,
                public view: ViewController) {
        this.hasLoaded = false;
        this.sqliteProvider.findAll('`emplacement`').subscribe((emplacements) => {
            this.emplacements = emplacements;
            if (typeof (navParams.get('collecte')) !== undefined) {
                this.collecte = navParams.get('collecte');
                this.hasLoaded = true;
            }
        })
    }

    selectEmplacement(emplacement: Emplacement) {
        this.emplacement = emplacement;
        this.navCtrl.setRoot(CollecteEmplacementPage, {
            collecte : this.collecte,
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
