import {Component, ViewChild, Injectable} from '@angular/core';
import {Platform, MenuController, Nav, Events, ToastController} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {ConnectPage} from '@pages/connect/connect';
import {StatusBar} from '@ionic-native/status-bar';
import {SplashScreen} from '@ionic-native/splash-screen';
import {NetworkProvider} from '@providers/network/network';
import {Network} from '@ionic-native/network';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {TracaMenuPage} from '@pages/traca/traca-menu/traca-menu';
import {PreparationMenuPage} from '@pages/preparation/preparation-menu/preparation-menu';
import {LivraisonMenuPage} from '@pages/livraison/livraison-menu/livraison-menu';
import {InventaireMenuPage} from '@pages/inventaire-menu/inventaire-menu';


@Injectable()
@Component({
    templateUrl: 'app.component.html'
})
export class AppComponent {
    @ViewChild(Nav)
    public nav: Nav;

    // make ConnectPage the root (or first) page
    public rootPage = ConnectPage;
    public pages: Array<{ title: string, component: any }>;
    public homePage = MenuPage;
    public addMvtURL: string = '/api/addMouvementTraca';

    public constructor(public platform: Platform,
                       public menu: MenuController,
                       public statusBar: StatusBar,
                       public splashScreen: SplashScreen,
                       public networkProvider: NetworkProvider,
                       public events: Events,
                       public http: HttpClient,
                       public network: Network,
                       public sqlProvider: SqliteProvider,
                       public toastController: ToastController) {
        this.initializeApp();

        // set our app's pages
        this.pages = [
            {title: 'Accueil', component: MenuPage},
            {title: 'Traça', component: TracaMenuPage},
            {title: 'Préparation', component: PreparationMenuPage},
            {title: 'Livraison', component: LivraisonMenuPage},
            {title: 'Inventaire', component: InventaireMenuPage}
        ];

        console.log('------------------ PLUGINS')
        console.log((<any>window).plugins)

    }

    public initializeApp() {
        this.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            this.statusBar.styleDefault();
            this.splashScreen.hide();
            this.networkProvider.initializeNetworkEvents();

            // Offline event
            this.events.subscribe('network:offline', () => {
                console.log('network:offline ==> ' + this.network.type);
            });

            // Online event
            this.events.subscribe('network:online', () => {
                this.sqlProvider.getAPI_URL().subscribe((resultUrl) => {
                    if (resultUrl !== null) {
                        const url: string = resultUrl + this.addMvtURL;
                        this.sqlProvider.findAll('`mouvement_traca`').subscribe((data) => {
                            this.sqlProvider.getApiKey().then(result => {
                                const toInsert = {
                                    mouvements: data,
                                    apikey: result
                                };
                                this.http.post<any>(url, toInsert).subscribe((resp) => {
                                    if (resp.success) {
                                        this.showToast(resp.data.status);
                                    }
                                });
                            });
                        });
                    }
                });
            });
        });
    }

    public openPage(page) {
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        this.nav.setRoot(page.component);
    }

    public goHome() {
        this.nav.setRoot(this.homePage);
    }

    public async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }


}
