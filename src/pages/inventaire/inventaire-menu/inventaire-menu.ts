import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController, ModalController} from 'ionic-angular';
import {ModalQuantityPage} from "./modal-quantity";
import {MenuPage} from "../../menu/menu";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ArticleInventaire} from "../../../app/entities/articleInventaire";
import {SaisieInventaire} from "../../../app/entities/saisieInventaire";
import moment from "moment";

/**
 * Generated class for the InventaireMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-inventaire-menu',
    templateUrl: 'inventaire-menu.html',
})
export class InventaireMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    articles: Array<ArticleInventaire>;
    dataApi: string = '/api/getData';
    hasLoaded: boolean;
    addEntryURL : string = '/api/addInventoryEntries';

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public sqlLiteProvider: SqliteProvider,
        public toastController: ToastController,
        public http: HttpClient,
        private modalController: ModalController,
    ) {}

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    ionViewDidEnter() {
        this.synchronize();
        this.setBackButtonAction();
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            this.navCtrl.setRoot(MenuPage);
        }
    }

    addInventoryEntries() {
        this.sqlLiteProvider.getAPI_URL().then(baseUrl => {
           if (baseUrl !== null) {
               let url: string = baseUrl + this.addEntryURL;
               this.sqlLiteProvider.findAll('`saisie_inventaire`').then(data => {
                   if (data.length > 0) {
                       this.sqlLiteProvider.getApiKey().then(apiKey => {
                           let params = {
                               entries: data,
                               apiKey: apiKey
                           };
                           this.http.post<any>(url, params).subscribe(resp => {
                               if (resp.success) {
                                   this.sqlLiteProvider.deleteTable('`saisie_inventaire`');
                                   this.showToast(resp.data.status);
                               }
                           });
                       });
                   }
               })
           } else {
               this.showToast('Veuillez configurer votre URL dans les paramètres.')
           }
        });
    }

    synchronize() {
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().then((result) => {
            if (result !== null) {
                let url: string = result + this.dataApi;
                this.sqlLiteProvider.getApiKey().then((key) => {
                    this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                        if (resp.success) {
                            //TODO CG clean ??
                            this.sqlLiteProvider.cleanDataBase(true).then(() => {
                            // this.sqlLiteProvider.deleteTable('`article_inventaire`').then(() => {
                                this.sqlLiteProvider.importArticlesInventaire(resp.data)
                                    .then(() => {
                                        this.sqlLiteProvider.findAll('`article_inventaire`').then(articles => {
                                            this.articles = articles;
                                            setTimeout(() => {
                                                this.hasLoaded = true;
                                                this.content.resize();
                                            }, 1000);
                                        });
                                    });
                                this.addInventoryEntries();
                            });
                        } else {
                            this.hasLoaded = true;
                            this.showToast('Une erreur est survenue.');
                        }
                    }, error => {
                        this.hasLoaded = true;
                        this.showToast('Une erreur réseau est survenue.');
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

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            //crée saisie inventaire et envoie vers api
            let saisieInventaire: SaisieInventaire = {
                id: null,
                id_mission: article.id_mission,
                date: moment().format(),
                reference: article.reference,
                is_ref: article.is_ref,
                quantity: data.quantity,
                location: article.location,
            };
            this.sqlLiteProvider.insert('`saisie_inventaire`', saisieInventaire).then(() => {
                //supprime l'article de la base
                this.sqlLiteProvider.deleteById('`article_livraison`', article.id);
                // supprime la ligne du tableau
                let index = this.articles.indexOf(article);
                if (index > -1) this.articles.splice(index, 1);
                this.addInventoryEntries();
            });
        });
        modal.present();
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad InventaireMenuPage');
    }

}

