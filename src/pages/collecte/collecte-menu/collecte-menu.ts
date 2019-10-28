import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import { CollecteArticlesPage } from "../collecte-articles/collecte-articles";
import {Collecte} from "../../../app/entities/collecte";

@IonicPage()
@Component({
    selector: 'page-collectes-menu',
    templateUrl: 'collecte-menu.html',
})
export class CollecteMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    collectes: Array<Collecte>;
    dataApi: string = '/api/getData';
    hasLoaded: boolean;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient) {
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
            this.navCtrl.setRoot(MenuPage);
        }
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().subscribe(
            (result) => {
                if (result !== null) {
                    let url: string = result + this.dataApi;
                    this.sqlLiteProvider.getApiKey().then((key) => {
                        this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                            if (resp.success) {
                                this.sqlLiteProvider.cleanDataBase(true).subscribe(() => {
                                    this.sqlLiteProvider.importData(resp.data, true)
                                        .subscribe(() => {
                                            this.sqlLiteProvider.findAll('`collecte`').subscribe(collectes => {
                                                this.collectes = collectes
                                                    .filter(c => c.date_end === null)
                                                    .sort(({emplacement: emplacement1}, {emplacement: emplacement2}) => ((emplacement1 < emplacement2) ? -1 : 1));
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
            },
            err => console.log(err)
        );
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

    goToArticles(collecte) {
        this.navCtrl.push(CollecteArticlesPage, {collecte});
    }

}