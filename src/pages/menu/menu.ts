import {Component, ViewChild} from '@angular/core';
import {App, NavController, Content, NavParams, Slides, Platform} from 'ionic-angular';
import {TracaMenuPage} from '@pages/traca/traca-menu/traca-menu'
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from '@pages/preparation/preparation-menu/preparation-menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {LivraisonMenuPage} from '@pages/livraison/livraison-menu/livraison-menu';
import {ParamsPage} from '@pages/params/params';
import {ConnectPage} from '@pages/connect/connect';
import {InventaireMenuPage} from '@pages/inventaire-menu/inventaire-menu';
import {CollecteMenuPage} from '@pages/collecte/collecte-menu/collecte-menu';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';
import {HttpClient} from '@angular/common/http';
import {Subscription} from 'rxjs';


@Component({
    selector: 'page-menu',
    templateUrl: 'menu.html'
})
export class MenuPage {

    private static readonly SUB_MENUS: Array<string> = [
        InventaireMenuPage.name,
        ManutentionMenuPage.name,
        TracaMenuPage.name,
        LivraisonMenuPage.name,
        PreparationMenuPage.name,
        CollecteMenuPage.name,
    ];

    @ViewChild(Slides) slides: Slides;
    @ViewChild(Content) content: Content;
    items: Array<{ title: string, icon: string, page: Page, img: string }>;
    nbPrep: number;
    nbPrepT: number;
    nbArtInvent: number;
    loading: boolean;
    apiUrl: string = '/api/getData';

    private backButtonSubscription: Subscription;

    public constructor(public app: App,
                       public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public network: Network,
                       public toastService: ToastService,
                       public http: HttpClient,
                       public platform: Platform) {

        this.items = [
            {title: 'Traça', icon: 'cube', page: TracaMenuPage, img: null},
            {title: 'Préparation', icon: 'cart', page: PreparationMenuPage, img: null},
            {title: 'Livraison', icon: 'paper-plane', page: LivraisonMenuPage, img: null},
            {title: 'Inventaire', icon: 'list-box', page: InventaireMenuPage, img: null},
            {title: 'Manutention', icon: 'list-box', page: ManutentionMenuPage, img: 'assets/icon/manut_icon.svg'},
            {title: 'Collecte', icon: 'list-box', page: CollecteMenuPage, img: null},
            {title: 'Déconnexion', icon: 'log-out', page: null, img: null}
        ];
    }

    private ionViewWillEnter(): void {
        this.backButtonSubscription = this.platform.backButton.subscribe(() => {
            if (MenuPage.SUB_MENUS.some(p => p === this.navCtrl.getActive().name)) {
                this.synchronise();
            }
        });

        if (this.navParams.get('needReload') === undefined) {
            this.synchronise();
        } else {
            this.loading = false;
        }
        this.refreshCounters();
    }

    public ionViewWillLeave(): void {
        if (this.backButtonSubscription) {
            this.backButtonSubscription.unsubscribe();
            this.backButtonSubscription = undefined;
        }
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
            (<any>window).plugins.intentShim.unregisterBroadcastReceiver();
            this.navCtrl.setRoot(ConnectPage);
        } else {
            this.navCtrl.push(item.page);
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
