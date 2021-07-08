import {Component, NgZone} from '@angular/core';
import {MenuConfig} from '@app/common/components/menu/menu-config';
import {from, Observable, Subject, Subscription, zip} from 'rxjs';
import {flatMap, map, take, tap} from 'rxjs/operators';
import {AlertController, Platform} from '@ionic/angular';
import {Preparation} from '@entities/preparation';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {Network} from '@ionic-native/network/ngx';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {StatsSlidersData} from '@app/common/components/stats-sliders/stats-sliders-data';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {ILocalNotification} from '@ionic-native/local-notifications';
import {NotificationService} from '@app/common/services/notification.service';


@Component({
    selector: 'wii-main-menu',
    templateUrl: './main-menu.page.html',
    styleUrls: ['./main-menu.page.scss'],
})
export class MainMenuPage extends PageComponent {
    public statsSlidersData: Array<StatsSlidersData>;

    public loading: boolean;
    public displayNotifications: boolean;

    public menuConfig: Array<MenuConfig>;

    public messageLoading?: string;

    // TODO migration
    private exitAlert: HTMLIonAlertElement;

    private backButtonSubscription: Subscription;
    private synchronisationSubscription: Subscription;
    private synchroniseActionSubscription: Subscription;
    private notificationSubscription: Subscription;

    private pageIsRedirecting: boolean;

    public constructor(private alertController: AlertController,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private network: Network,
                       private platform: Platform,
                       private ngZone: NgZone,
                       private notificationService: NotificationService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
        this.displayNotifications = false;
        this.pageIsRedirecting = false;
    }

    public ionViewWillEnter(): void {
        super.ionViewWillEnter();
        const notification = this.currentNavParams.get('notification');

        this.synchronise().subscribe(() => {
            if (notification) {
                this.doNotificationRedirection(notification);
            }
        });

        this.backButtonSubscription = this.platform.backButton.subscribe(() => {
            this.onBackButton();
        });
        this.notificationSubscription = this.notificationService.$localNotification.subscribe((notification) => {
            this.doSynchronisationAndNotificationRedirection(notification);
        });
    }

    public ionViewWillLeave(): void {
        if (this.backButtonSubscription) {
            this.backButtonSubscription.unsubscribe();
            this.backButtonSubscription = undefined;
        }
        if (this.synchronisationSubscription) {
            this.synchronisationSubscription.unsubscribe();
            this.synchronisationSubscription = undefined;
        }
        this.unsubscribeNotification();
    }

    public refreshCounters(): Observable<void> {
        return zip(
            this.sqliteService.findAll('preparation'),
            this.storageService.getFinishedPreps(),
            this.sqliteService.count('article_inventaire')
        )
            .pipe(
                take(1),
                tap(([preparations, preps, nbArticlesInventaire]: [Array<Preparation>, number, number]) => {
                    this.statsSlidersData = this.createStatsSlidersData(preparations, preps, nbArticlesInventaire);
                }),
                map(() => undefined)
            );
    }

    public synchronise(): Observable<void> {
        const $res = new Subject<void>();
        if (this.network.type !== 'none') {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData()
                .pipe(
                    flatMap(({finished, message}) => (
                        zip(
                            this.storageService.getDemandeAccessRight(),
                            this.storageService.getTrackingAccessRight(),
                            this.storageService.getStockAccessRight(),
                        ).pipe(map(([demande, tracking, stock]) => ({
                            finished,
                            message,
                            rights: {demande, tracking, stock}
                        })))
                    ))
                )
                .subscribe(
                    ({finished, message, rights}) => {
                        this.messageLoading = message;
                        if (finished) {
                            this.displayNotifications = Boolean(rights.stock);
                            this.resetMainMenuConfig(rights);
                            this.refreshCounters().subscribe(() => {
                                this.loading = false;
                                $res.next();
                                $res.complete();
                            });
                        }
                        else {
                            this.loading = true;
                        }
                    },
                    (error) => {
                        const {api, message} = error;
                        this.refreshCounters().subscribe(() => {
                            this.loading = false;
                        });
                        if (api && message) {
                            this.toastService.presentToast(message);
                        }
                        $res.complete();
                        throw error;
                    });
        }
        else {
            this.loading = false;
            this.toastService.presentToast('Veuillez vous connecter à internet afin de synchroniser vos données');
            this.refreshCounters();
            $res.complete();
        }
        return $res;
    }

    private onBackButton(): void {
        if (this.exitAlert) {
            this.exitAlert.dismiss();
            this.exitAlert = undefined;
        }
        else {
            from(this.alertController
                .create({
                    header: `Êtes-vous sûr de vouloir quitter l'application ?`,
                    backdropDismiss: false,
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
                                navigator['app'].exitApp();
                            },
                            cssClass: 'alert-success'
                        }
                    ]
                }))
                .subscribe((exitAlert: HTMLIonAlertElement) => {
                    this.exitAlert = exitAlert;
                    this.exitAlert.present();
                });
        }
    }

    private resetMainMenuConfig(rights: {stock?: boolean, demande?: boolean, tracking?: boolean}) {
        this.menuConfig = [];
        if (rights.tracking) {
            this.menuConfig.push({
                icon: 'tracking.svg',
                label: 'Traçabilité',
                action: () => {
                    this.navService.push(NavPathEnum.TRACKING_MENU, {
                        fromStock: false
                    });
                }
            });
        }

        if (rights.stock) {
            this.menuConfig.push({
                icon: 'stock.svg',
                label: 'Stock',
                action: () => {
                    this.navService.push(NavPathEnum.STOCK_MENU, {avoidSync: true});
                }
            });
        }

        if (rights.demande) {
            this.menuConfig.push({
                icon: 'demande.svg',
                iconColor: 'success',
                label: 'Demande',
                action: () => {
                    this.navService.push(NavPathEnum.DEMANDE_MENU);
                }
            });
        }
    }

    private createStatsSlidersData(preparations: Array<Preparation>,
                                   nbPrepT: number,
                                   nbArticlesInventaire: number): Array<StatsSlidersData> {
        const nbPrep = preparations.filter(p => p.date_end === null).length;
        const sNbPrep = nbPrep > 1 ? 's' : '';
        const sNbPrepT = nbPrepT > 1 ? 's' : '';
        const sNbArticlesInventaire = nbArticlesInventaire > 1 ? 's' : '';
        return [
            { label: `Préparation${sNbPrep} à traiter`, counter: nbPrep },
            { label: `Préparation${sNbPrepT} traitée${sNbPrepT}`, counter: nbPrepT },
            { label: `Article${sNbArticlesInventaire} à inventorier`, counter: nbArticlesInventaire }
        ]
    }

    private doSynchronisationAndNotificationRedirection(notification: ILocalNotification): void {
        if(notification && !this.synchroniseActionSubscription) {
            this.synchroniseActionSubscription = this.synchronise()
                .subscribe(
                    () => {
                        this.doNotificationRedirection(notification);
                        this.unsubscribeSynchroniseAction();
                    },
                    () => {
                        this.unsubscribeSynchroniseAction();
                    },
                    () => {
                        this.unsubscribeSynchroniseAction();
                    });
        }
    }

    private doNotificationRedirection(notification: ILocalNotification) {
        if (!this.pageIsRedirecting && notification) {
            this.ngZone.run(() => {
                const {data} = notification;
                if (data.type === 'dispatch') {
                    this.pageIsRedirecting = true;
                    const dispatchId = Number(data.id);
                    this.navService
                        .push(NavPathEnum.TRACKING_MENU)
                        .pipe(
                            flatMap(() => this.navService.push(NavPathEnum.DISPATCH_MENU)),
                            flatMap(() => this.navService.push(NavPathEnum.DISPATCH_PACKS, {dispatchId}))
                        )
                        .subscribe(() => {
                            this.pageIsRedirecting = false;
                        });
                }
                else if (data.type === 'service') {
                    this.pageIsRedirecting = true;
                    const handlingId = Number(data.id);
                    this.sqliteService.findOneBy('handling', {id: handlingId}).subscribe((handling) => {
                        if (handling) {
                            this.navService
                                .push(NavPathEnum.DEMANDE_MENU)
                                .pipe(
                                    flatMap(() => this.navService.push(NavPathEnum.HANDLING_MENU)),
                                    flatMap(() => this.navService.push(NavPathEnum.HANDLING_VALIDATE, {handling}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (data.type === 'transfer') {
                    this.pageIsRedirecting = true;
                    const transferId = Number(data.id);
                    this.sqliteService.findOneBy('transfer_order', {id: transferId}).subscribe((transferOrder) => {
                        if (transferOrder) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    flatMap(() => this.navService.push(NavPathEnum.TRANSFER_MENU)),
                                    flatMap(() => this.navService.push(NavPathEnum.TRANSFER_LIST, {withoutLoading: true})),
                                    flatMap(() => this.navService.push(NavPathEnum.TRANSFER_ARTICLES, {transferOrder}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (data.type === 'preparation') {
                    this.pageIsRedirecting = true;
                    const preparationId = Number(data.id);
                    this.sqliteService.findOneBy('preparation', {id: preparationId}).subscribe((preparation) => {
                        if (preparation) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    flatMap(() => this.navService.push(NavPathEnum.PREPARATION_MENU)),
                                    flatMap(() => this.navService.push(NavPathEnum.PREPARATION_ARTICLES, {preparation}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (data.type === 'delivery') {
                    this.pageIsRedirecting = true;
                    const deliveryId = Number(data.id);
                    this.sqliteService.findOneBy('livraison', {id: deliveryId}).subscribe((delivery) => {
                        if (delivery) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    flatMap(() => this.navService.push(NavPathEnum.LIVRAISON_MENU)),
                                    flatMap(() => this.navService.push(NavPathEnum.LIVRAISON_ARTICLES, {livraison: delivery}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
                else if (data.type === 'collect') {
                    this.pageIsRedirecting = true;
                    const collectId = Number(data.id);
                    this.sqliteService.findOneBy('collecte', {id: collectId}).subscribe((collect) => {
                        if (collect) {
                            this.navService
                                .push(NavPathEnum.STOCK_MENU)
                                .pipe(
                                    flatMap(() => this.navService.push(NavPathEnum.COLLECTE_MENU)),
                                    flatMap(() => this.navService.push(NavPathEnum.COLLECTE_ARTICLES, {collecte: collect}))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    })
                }
            });
        }
    }

    private unsubscribeNotification(): void {
        if (this.notificationSubscription && !this.notificationSubscription.closed) {
            this.notificationSubscription.unsubscribe();
        }
        this.notificationSubscription = undefined;
    }

    private unsubscribeSynchroniseAction(): void {
        if (this.synchroniseActionSubscription && !this.synchroniseActionSubscription.closed) {
            this.synchroniseActionSubscription.unsubscribe();
        }
        this.synchroniseActionSubscription = undefined;
    }
}
