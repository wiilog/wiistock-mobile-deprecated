import {Component, ViewChild} from '@angular/core';
import {Slides, Platform, AlertController, Alert, NavController} from 'ionic-angular';
import {TracaMenuPage} from '@pages/traca-menu/traca-menu'
import {Page} from "ionic-angular/navigation/nav-util";
import {PreparationMenuPage} from '@pages/stock/preparation/preparation-menu/preparation-menu';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {LivraisonMenuPage} from '@pages/stock/livraison/livraison-menu/livraison-menu';
import {InventaireMenuPage} from '@pages/stock/inventaire-menu/inventaire-menu';
import {CollecteMenuPage} from '@pages/stock/collecte/collecte-menu/collecte-menu';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {Subscription} from 'rxjs';
import {MenuConfig} from "@helpers/components/menu/menu-config";
import {StockMenuPage} from "@pages/stock/stock-menu/stock-menu";


@Component({
    selector: 'page-main-menu',
    templateUrl: 'main-menu.html'
})
export class MainMenuPage {

    @ViewChild(Slides) slides: Slides;
    items: Array<{ title: string, icon: string, page: Page, img: string }>;
    nbPrep: number;
    nbPrepT: number;
    nbArtInvent: number;
    loading: boolean;

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading?: string;

    private exitAlert: Alert;

    private unregisterBackButtonAction: Function;

    private synchronisationSubscription: Subscription;

    public constructor(navController: NavController,
                       private sqliteProvider: SqliteProvider,
                       private network: Network,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private alertController: AlertController,
                       private localDataManager: LocalDataManagerService,
                       private platform: Platform) {

        this.loading = true;

        this.menuConfig = [
            {
                icon: 'tracking.svg',
                label: 'Traçabilité',
                action() {
                    navController.push(TracaMenuPage);
                }
            },
            {
                icon: 'stock.svg',
                label: 'Stock',
                action() {
                    navController.push(StockMenuPage);
                }
            },
            {
                icon: 'people.svg',
                label: 'Demande',
                action() {
                    navController.push(ManutentionMenuPage);
                }
            }
        ];

        this.items = [
            {title: 'Préparation', icon: 'cart', page: PreparationMenuPage, img: null},
            {title: 'Livraison', icon: 'paper-plane', page: LivraisonMenuPage, img: null},
            {title: 'Inventaire', icon: 'list-box', page: InventaireMenuPage, img: null},
            {title: 'Collecte', icon: 'list-box', page: CollecteMenuPage, img: null},
            {title: 'Déconnexion', icon: 'log-out', page: null, img: null}
        ];
    }

    public ionViewWillEnter(): void {
        this.synchronise();
        this.refreshCounters();

        this.unregisterBackButtonAction = this.platform.registerBackButtonAction(() => {
            this.onBackButton();
        });
    }

    public ionViewWillLeave(): void {
        if (this.unregisterBackButtonAction) {
            this.unregisterBackButtonAction();
            this.unregisterBackButtonAction = undefined;
        }
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
    }

    public refreshCounters(): void {
        this.sqliteProvider.findAll('`preparation`').subscribe((preparations: Array<Preparation>) => {
            this.nbPrep = preparations.filter(p => p.date_end === null).length;
            this.storageService.getFinishedPreps().subscribe((preps) => {
                this.nbPrepT = preps;
                this.sqliteProvider.count('`article_inventaire`', []).subscribe((nbArticlesInventaire: number) => {
                    this.nbArtInvent = nbArticlesInventaire;
                });
            });
        });
    }

    public synchronise(): void {
        if (this.network.type !== 'none') {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe(
                ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                    if (finished) {
                        this.refreshCounters();
                    }
                },
                ({api, message}) => {
                    this.loading = false;
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    this.refreshCounters();
                });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
            this.refreshCounters();
        }
    }

    private onBackButton(): void {
        if (this.exitAlert) {
            this.exitAlert.dismiss();
            this.exitAlert = undefined;
        }
        else {
            this.exitAlert = this.alertController
                .create({
                    title: `Êtes-vous sûr de vouloir quitter l'application ?`,
                    // TODO backdropDismiss: false for ionic 4
                    enableBackdropDismiss: false,
                    buttons: [
                        {
                            text: 'Annuler',
                            handler: () => {
                                this.exitAlert = undefined;
                            }
                        },
                        {
                            text: 'Confirmer',
                            handler: () => {
                                this.platform.exitApp();
                            },
                            cssClass: 'alertAlert'
                        }
                    ]
                });

            this.exitAlert.present();
        }
    }
}
