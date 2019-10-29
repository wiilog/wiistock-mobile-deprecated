import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import { LivraisonArticlesPage } from "../livraison-articles/livraison-articles";
import {Livraison} from "../../../app/entities/livraison";
import {Network} from "@ionic-native/network";

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
    dataApi: string = '/api/getLivraisons';
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient,
        public network : Network) {
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
        if (this.network.type !== 'none') {
            this.sqlLiteProvider.getAPI_URL().subscribe(
                (result) => {
                    if (result !== null) {
                        let url: string = result + this.dataApi;
                        this.sqlLiteProvider.getApiKey().then((key) => {
                            this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                                if (resp.success) {
                                    this.sqlLiteProvider.importLivraisons(resp).subscribe(() => {
                                        this.sqlLiteProvider.importArticlesLivraison(resp).subscribe(() => {
                                            this.sqlLiteProvider.findAll('`livraison`').subscribe((livraisons) => {
                                                this.livraisons = livraisons.filter(l => l.date_end === null);
                                                this.hasLoaded = true;
                                                this.content.resize();
                                            })
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
                },
                err => console.log(err)
            );
        } else {
            this.sqlLiteProvider.findAll('`livraison`').subscribe((livraisons) => {
                this.livraisons = livraisons.filter(l => l.date_end === null);
                this.hasLoaded = true;
                this.content.resize();
            })
        }
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
