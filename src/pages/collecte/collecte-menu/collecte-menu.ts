import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import { CollecteArticlesPage } from "../collecte-articles/collecte-articles";
import {Collecte} from "../../../app/entities/collecte";
import {ToastService} from "@app/services/toast.service";

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
        private toastService: ToastService,
        public http: HttpClient) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewWillEnter() {
        this.synchronise(true);
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
                                this.toastService.showToast('Erreur');
                            }
                        }, error => {
                            this.hasLoaded = true;
                            this.toastService.showToast('Erreur réseau');
                        });
                    });
                } else {
                    this.toastService.showToast('Veuillez configurer votre URL dans les paramètres.')
                }
            },
            err => console.log(err)
        );
    }

    goToArticles(collecte) {
        this.navCtrl.push(CollecteArticlesPage, {collecte});
    }

}
