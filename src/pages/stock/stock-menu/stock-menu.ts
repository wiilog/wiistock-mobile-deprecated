import {Component} from '@angular/core';
import {IonicPage, NavController, Platform} from 'ionic-angular';
import {MenuConfig} from "@helpers/components/menu/menu-config";
import {PreparationMenuPage} from "@pages/stock/preparation/preparation-menu/preparation-menu";
import {LivraisonMenuPage} from "@pages/stock/livraison/livraison-menu/livraison-menu";
import {InventaireMenuPage} from "@pages/stock/inventaire-menu/inventaire-menu";
import {PriseDeposeMenuPage} from "@pages/prise-depose/prise-depose-menu/prise-depose-menu";
import {CollecteMenuPage} from "@pages/stock/collecte/collecte-menu/collecte-menu";
import {Observable, Subscription} from "rxjs";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {ToastService} from "@app/services/toast.service";
import {Network} from "@ionic-native/network";
import {MainHeaderService} from "@app/services/main-header.service";


@IonicPage()
@Component({
    selector: 'page-stock-menu',
    templateUrl: 'stock-menu.html',
})
export class StockMenuPage {

    public readonly menuConfig: Array<MenuConfig>;

    public messageLoading: string;
    public loading: boolean;

    private avoidSync: boolean;
    private synchronisationSubscription: Subscription;
    private navigationSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private platform: Platform,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private network: Network,
                       private toastService: ToastService) {
        this.avoidSync = true;
        this.menuConfig = [
            {
                icon: 'stock-transfer.svg',
                label: 'Transfert',
                action: () => {
                    this.navCtrl.push(PriseDeposeMenuPage, {
                        fromStock: true
                    });
                }
            },
            {
                icon: 'preparation.svg',
                label: 'Préparation',
                action: () => { this.navCtrl.push(PreparationMenuPage); }
            },
            {
                icon: 'delivery.svg',
                label: 'Livraison',
                action: () => { this.navCtrl.push(LivraisonMenuPage); }
            },
            {
                icon: 'collecte.svg',
                label: 'Collecte',
                action: () => {
                    this.navCtrl.push(
                        CollecteMenuPage,
                        {
                            avoidSync: () => {
                                this.setAvoidSync(true);
                            },
                            goToDepose: () => {
                                this.goToDepose();
                            }
                        }
                    );
                }
            },
            {
                icon: 'inventary.svg',
                label: 'Inventaire',
                action: () => { this.navCtrl.push(InventaireMenuPage); }
            }
        ];
    }

    public synchronise(): void {
        if (this.network.type !== 'none') {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData().subscribe(
                ({finished, message}) => {
                    this.messageLoading = message;
                    this.loading = !finished;
                },
                (error) => {
                    const {api, message} = error;
                    this.loading = false;
                    if (api && message) {
                        this.toastService.presentToast(message);
                    }
                    throw error;
                });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
        }
    }

    public ionViewWillEnter(): void {
        this.navigationSubscription = Observable
            .merge(
                this.mainHeaderService.navigationChange$,
                this.platform.backButton
            )
            .subscribe(() => {
                this.setAvoidSync(true);
            });

        if (!this.avoidSync) {
            this.synchronise();
        }
        else {
            this.setAvoidSync(false);
        }
    }

    public ionViewWillLeave(): void {
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        if (this.navigationSubscription) {
            this.navigationSubscription.unsubscribe();
            this.navigationSubscription = undefined;
        }
    }

    public goToDepose() {
        this.navCtrl
            .push(PriseDeposeMenuPage, {
                fromStock: true,
                goToDeposeDirectly: true
            });
    }

    public setAvoidSync(avoidSync: boolean) {
        this.avoidSync = avoidSync;
    }
}
