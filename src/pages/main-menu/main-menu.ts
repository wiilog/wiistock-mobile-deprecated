import {Component, ViewChild} from '@angular/core';
import {Slides, Platform, AlertController, Alert, NavController} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {Subscription} from 'rxjs';
import {MenuConfig} from '@helpers/components/menu/menu-config';
import {StockMenuPage} from '@pages/stock/stock-menu/stock-menu';
import {PriseDeposeMenuPage} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu';


@Component({
    selector: 'page-main-menu',
    templateUrl: 'main-menu.html'
})
export class MainMenuPage {

    @ViewChild(Slides)
    slides: Slides;

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
                    navController.push(PriseDeposeMenuPage, {
                        fromStock: false
                    });
                }
            },
            {
                icon: 'stock.svg',
                label: 'Stock',
                action() {
                    navController.push(StockMenuPage, {fromMainMenu: true});
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
    }

    public ionViewWillEnter(): void {
        this.synchronise();

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
                (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    this.refreshCounters();
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
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
                            cssClass: 'alert-success'
                        }
                    ]
                });

            this.exitAlert.present();
        }
    }
}
