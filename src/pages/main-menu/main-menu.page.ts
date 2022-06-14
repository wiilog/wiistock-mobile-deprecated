import {Component, NgZone} from '@angular/core';
import {ColumnNumber, MenuConfig} from '@app/common/components/menu/menu-config';
import {Observable, Subject, Subscription, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {Platform} from '@ionic/angular';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {ILocalNotification} from '@ionic-native/local-notifications';
import {NotificationService} from '@app/common/services/notification.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';
import {ApiService} from '@app/common/services/api.service';


@Component({
    selector: 'wii-main-menu',
    templateUrl: './main-menu.page.html',
    styleUrls: ['./main-menu.page.scss'],
})
export class MainMenuPage extends PageComponent {
    public readonly ColumnNumber = ColumnNumber;

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
    private lastNotificationRedirected: ILocalNotification;

    public constructor(private alertService: AlertService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private storageService: StorageService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
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
            if (notification && this.lastNotificationRedirected !== notification) {
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

    public synchronise(): Observable<void> {
        const $res = new Subject<void>();
        if (this.networkService.hasNetwork()) {
            this.loading = true;

            this.synchronisationSubscription = this.localDataManager.synchroniseData()
                .pipe(
                    flatMap(({finished, message}) => (
                        zip(
                            this.storageService.getRight(StorageKeyEnum.RIGHT_DEMANDE),
                            this.storageService.getRight(StorageKeyEnum.RIGHT_TRACKING),
                            this.storageService.getRight(StorageKeyEnum.RIGHT_STOCK),
                            this.storageService.getRight(StorageKeyEnum.RIGHT_TRACK),
                        ).pipe(map(([demande, tracking, stock, track]) => ({
                            finished,
                            message,
                            rights: {demande, tracking, stock, track}
                        })))
                    ))
                )
                .subscribe(
                    ({finished, message, rights}) => {
                        this.messageLoading = message;
                        if (finished) {
                            this.displayNotifications = Boolean(rights.stock);
                            this.resetMainMenuConfig(rights);
                            this.loading = false;
                            $res.next();
                            $res.complete();
                        }
                        else {
                            this.loading = true;
                        }
                    },
                    (error) => {
                        this.loading = false;
                        const {api, message} = error;
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
            $res.complete();
        }
        return $res;
    }

    private async onBackButton(): Promise<void> {
        if (this.exitAlert) {
            this.exitAlert.dismiss();
            this.exitAlert = undefined;
        }
        else {
            this.exitAlert = await this.alertService.show({
                header: `Êtes-vous sûr de vouloir quitter l'application ?`,
                backdropDismiss: false,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel',
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
            });
        }
    }

    private resetMainMenuConfig(rights: {stock?: boolean, demande?: boolean, tracking?: boolean, track?: boolean}) {
        this.menuConfig = [];

        const actions = [];

        if (rights.tracking) {
            const action = () => {
                this.navService.push(NavPathEnum.TRACKING_MENU, {
                    fromStock: false
                });
            }
            this.menuConfig.push({
                icon: 'tracking.svg',
                label: 'Traçabilité',
                action
            });
            actions.push(action);
        }

        if (rights.stock) {
            const action = () => {
                this.navService.push(NavPathEnum.STOCK_MENU, {avoidSync: true});
            }
            this.menuConfig.push({
                icon: 'stock.svg',
                label: 'Stock',
                action
            });
            actions.push(action);
        }

        if (rights.demande) {
            const action = () => {
                this.navService.push(NavPathEnum.DEMANDE_MENU);
            };
            this.menuConfig.push({
                icon: 'demande.svg',
                iconColor: 'success',
                label: 'Demande',
                action
            });
            actions.push(action);
        }

        if (rights.track) {
            const action = () => {
                this.navService.push(NavPathEnum.TRANSPORT_ROUND_LIST);
            };
            this.menuConfig.push({
                icon: 'track.svg',
                label: 'Track',
                action
            });
            actions.push(action);
        }

        if (actions.length === 1) {
            actions[0]();
        }
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
            this.lastNotificationRedirected = notification;
            this.ngZone.run(() => {
                const {data} = notification;

                if(data.roundId) {
                    this.apiService.requestApi(ApiService.FETCH_ROUND, {
                        params: {round: data.roundId},
                    }).subscribe(round => {
                        this.navService
                            .push(NavPathEnum.TRANSPORT_ROUND_LIST)
                            .pipe(flatMap(() => this.navService.push(NavPathEnum.TRANSPORT_LIST, {
                                round,
                                cancelledTransport: data.transportId,
                            })))
                            .subscribe(() => {
                                this.pageIsRedirecting = false;
                            });
                    })
                }
                else if (data.type === 'dispatch') {
                    this.pageIsRedirecting = true;
                    const dispatchId = Number(data.id);
                    this.navService
                        .push(NavPathEnum.TRACKING_MENU)
                        .pipe(
                            flatMap(() => this.navService.push(NavPathEnum.DISPATCH_MENU, {withoutLoading: true})),
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
                                    flatMap(() => this.navService.push(NavPathEnum.HANDLING_MENU, {withoutLoading: true})),
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
                                    flatMap(() => this.navService.push(NavPathEnum.PREPARATION_MENU, {withoutLoading: true})),
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
                                    flatMap(() => this.navService.push(NavPathEnum.LIVRAISON_MENU, {withoutLoading: true})),
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
                                    flatMap(() => this.navService.push(NavPathEnum.COLLECTE_MENU, {withoutLoading: true})),
                                    flatMap(() => this.navService.push(NavPathEnum.COLLECTE_ARTICLES, {
                                        collecte: collect,
                                        goToDrop: () => {
                                            this.navService.pop().subscribe(() => {
                                                this.navService
                                                    .push(NavPathEnum.TRANSFER_MENU, {
                                                        goToDropDirectly: true
                                                    });
                                            });
                                        }
                                    }))
                                )
                                .subscribe(() => {
                                    this.pageIsRedirecting = false;
                                });
                        }
                        else {
                            this.pageIsRedirecting = false;
                        }
                    });
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
