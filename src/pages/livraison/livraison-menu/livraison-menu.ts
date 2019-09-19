import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import { LivraisonArticlesPage } from "../livraison-articles/livraison-articles";
import {Livraison} from "../../../app/entities/livraison";

/**
 * Generated class for the LivraisonMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-menu',
    templateUrl: 'livraison-menu.html',
})
export class LivraisonMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    livraisons: Array<Livraison>;
    dataApi: string = '/api/getData';
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient,) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewDidEnter() {
        this.synchronise(true);
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            //Write here wherever you wanna do
            this.navCtrl.setRoot(MenuPage);
        }
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().then((result) => {
            if (result !== null) {
                let url: string = result + this.dataApi;
                this.sqlLiteProvider.getApiKey().then((key) => {
                    this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                        if (resp.success) {
                            this.sqlLiteProvider.cleanDataBase(true).then(() => {
                                this.sqlLiteProvider.importData(resp.data, true)
                                    .then(() => {
                                        this.sqlLiteProvider.findAll('`livraison`').then(livraisons => {
                                            this.livraisons = livraisons.filter(p => p.date_end === null);
                                            setTimeout(() => {
                                                this.hasLoaded = true;
                                                this.content.resize();
                                            }, 1000);
                                        });
                                    });
                            });
                        } else {
                            this.hasLoaded = true;
                            this.showToast('Erreur');
                        }
                    }, error => {
                        this.hasLoaded = true;
                        this.showToast('Erreur réseau');
                    });
                });
            } else {
                this.showToast('Veuillez configurer votre URL dans les paramètres.')
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

    goToArticles(livraison) {
        this.navCtrl.push(LivraisonArticlesPage, {livraison: livraison});
    }

}
