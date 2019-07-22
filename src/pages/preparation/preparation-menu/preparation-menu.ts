import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Preparation} from "../../../app/entities/preparation";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {PreparationArticlesPage} from "../preparation-articles/preparation-articles";

/**
 * Generated class for the PreparationMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-menu',
    templateUrl: 'preparation-menu.html',
})
export class PreparationMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    preparations: Array<Preparation>;
    dataApi: string = 'getData';
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient,
        private changeDetectorRef: ChangeDetectorRef) {
    }

    goHome() {
        this.navCtrl.push(MenuPage);
    }

    ionViewDidEnter() {
        this.synchronise(true);
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            //Write here wherever you wanna do
            this.navCtrl.push(MenuPage);
        }
    }

    synchronise(fromStart: boolean) {
        console.log('import data');
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().then((result) => {
            if (result !== null) {
                let url: string = result + this.dataApi;
                console.log(url);
                this.http.post<any>(url, {}).subscribe(resp => {
                    if (resp.success) {
                        console.log('ccc');
                        this.sqlLiteProvider.importData(resp.data, true)
                            .then(() => {
                                this.sqlLiteProvider.findAll('`preparation`').then(preparations => {
                                    this.preparations = preparations.filter(p => p.date_end === null);
                                    this.hasLoaded = true;
                                });
                            });
                    } else {
                        this.hasLoaded = true;
                        this.showToast('Erreur');
                    }
                });
            } else {
                this.showToast('Aucune configuration URL...')
            }
        }).catch(err => console.log(err));
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

    goToArticles(preparation) {
        this.navCtrl.push(PreparationArticlesPage, {preparation: preparation});
    }

}
