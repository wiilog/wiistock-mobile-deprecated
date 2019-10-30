import {Component, ViewChild} from '@angular/core';
import {App, Content, NavController, NavParams, Slides} from 'ionic-angular';
import {StockageMenuPageTraca} from "../traca/stockage-menu/stockage-menu-traca"
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from "../preparation/preparation-menu/preparation-menu";
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {Preparation} from "../../app/entities/preparation";
import {LivraisonMenuPage} from "../livraison/livraison-menu/livraison-menu";
import {ParamsPage} from "../params/params";
import {ConnectPage} from "../connect/connect";
import {InventaireMenuPage} from "../inventaire-menu/inventaire-menu";
import {CollecteMenuPage} from "@pages/collecte/collecte-menu/collecte-menu";
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";
import {Network} from "@ionic-native/network";
import {ToastService} from "@app/services/toast.service";
import {HttpClient} from "@angular/common/http";

@Component({
    selector: 'page-menu',
    templateUrl: 'menu.html'
})
export class MenuPage {
    @ViewChild(Slides) slides: Slides;
    @ViewChild(Content) content: Content;
    items: Array<{ title: string, icon: string, page: Page, img: string }>;
    nbPrep: number;
    nbPrepT: number;
    nbArtInvent: number;
    loading: boolean;
    apiUrl : string = '/api/getData' ;

    constructor(public app: App, public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider, public network : Network,
                public toastService : ToastService, public http : HttpClient) {

        this.items = [
            {title: 'Traça', icon: 'cube', page: StockageMenuPageTraca, img: null},
            {title: 'Préparation', icon: 'cart', page: PreparationMenuPage, img: null},
            {title: 'Livraison', icon: 'paper-plane', page: LivraisonMenuPage, img: null},
            {title: 'Inventaire', icon: 'list-box', page: InventaireMenuPage, img: null},
            {title: 'Manutention', icon: 'list-box', page: ManutentionMenuPage, img: 'assets/icon/manut_icon.svg'},
            {title: 'Collecte', icon: 'list-box', page: CollecteMenuPage, img: null},
            {title: 'Déconnexion', icon: 'log-out', page: null, img: null}
        ];
    }

    ionViewDidEnter() {
        if (this.navParams.get('needReload') === undefined) {
            this.synchronise();
        } else {
            this.loading = false;
        }
        this.refreshCounters();
    }
    refreshCounters() {
        this.sqliteProvider.findAll('`preparation`').subscribe((preparations: Array<Preparation>) => {
            this.nbPrep = preparations.filter(p => p.date_end === null).length;
            this.sqliteProvider.getFinishedPreps().then((preps) => {
                this.nbPrepT = preps;
                this.sqliteProvider.count('`article_inventaire`', []).subscribe((nbArticlesInventaire: number) => {
                    this.nbArtInvent = nbArticlesInventaire;
                    this.sqliteProvider.getOperateur().then((username) => {
                        this.content.resize();
                    })
                });
            });
        });

    }

    itemTapped(event, item) {
        if (item.page === null) {
            this.navCtrl.setRoot(ConnectPage);
        } else {
            this.navCtrl.setRoot(item.page);
        }
    }

    goToParams() {
        this.navCtrl.push(ParamsPage);
    }

    synchronise() {
        if (this.network.type !== 'none') {
            this.loading = true;
            this.sqliteProvider.getAPI_URL().subscribe((result) => {
                let apiURL = result + this.apiUrl;
                this.sqliteProvider.getApiKey().then((key) => {
                    this.http.post<any>(apiURL, {apiKey : key}).subscribe((resp) => {
                        if (resp.success) {
                            this.sqliteProvider.importData(resp.data, true).subscribe(() => {
                                this.loading = false;
                                this.refreshCounters();
                            })
                        } else {
                            this.loading = false;
                            this.toastService.showToast(resp.msg);
                            this.refreshCounters();
                        }
                    })
                });
            });
        } else {
            this.loading = false;
            this.toastService.showToast('Veuillez vous connecter a internet afin de synchroniser vos données');
            this.refreshCounters();
        }
    }

}
