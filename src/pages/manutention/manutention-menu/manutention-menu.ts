import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {Manutention} from "@app/entities/manutention";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {MenuPage} from "@pages/menu/menu";
import {ManutentionValidatePage} from "@pages/manutention/manutention-validate/manutention-validate";

/**
 * Generated class for the ManutentionMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-manutention-menu',
    templateUrl: 'manutention-menu.html',
})
export class ManutentionMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    manutentions: Array<Manutention>;
    dataApi: string = '/api/getData';
    hasLoaded: boolean;
    user : string;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient,
    ) {
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewDidLoad() {
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
                                this.sqlLiteProvider.cleanDataBase(fromStart).subscribe(() => {
                                    this.sqlLiteProvider.importData(resp.data, true)
                                        .then(() => {
                                            this.sqlLiteProvider.getOperateur().then((username) => {
                                                this.user = username;
                                                this.sqlLiteProvider.findAll('`manutention`').subscribe(manutentions => {
                                                    this.manutentions = manutentions;
                                                    setTimeout(() => {
                                                        this.hasLoaded = true;
                                                        this.content.resize();
                                                    }, 1000);
                                                });
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

    goToManut(manutention: Manutention) {
        this.navCtrl.push(ManutentionValidatePage, {manutention: manutention});
    }

    toDate(manutention : Manutention) {
        return new Date(manutention.date_attendue);
    }

}
