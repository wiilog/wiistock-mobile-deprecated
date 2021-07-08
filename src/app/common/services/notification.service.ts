import {Injectable, NgZone} from '@angular/core';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {Platform} from '@ionic/angular';
import {from, Observable, of, Subject, Subscription, zip} from 'rxjs';
import {filter, flatMap, map, tap} from 'rxjs/operators';
import {INotificationPayload} from 'cordova-plugin-fcm-with-dependecy-updated';
import {ILocalNotification} from '@ionic-native/local-notifications';
import {NavService} from '@app/common/services/nav.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

declare let cordova: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private FCMNotificationSubscription: Subscription;
    private localNotificationTappedSubscription: Subscription;

    private readonly _$localNotification: Subject<ILocalNotification>;

    private _userIsLogged: boolean;

    public constructor(private storageService: StorageService,
                       private platform: Platform,
                       private fcm: FCM,
                       private ngZone: NgZone,
                       private localNotifications: LocalNotifications,
                       private navService: NavService) {
        this._$localNotification = new Subject<ILocalNotification>();
        this._userIsLogged = false;
    }

    public initialize(): Observable<{ notification?: ILocalNotification }> {
        return from(this.platform.ready()).pipe(
            flatMap(() => this.fcm.deleteInstanceId()),
            flatMap(() => this.subscribeToTopics()),
            flatMap(() => this.getTappedNotification()),
            map((notification) => ({notification})),
            tap(() => {
                this.handleFCMNotifications();
                this.handleLocalNotificationTapped();
            })
        );
    }

    public set userIsLogged(userIsLogged: boolean) {
        this._userIsLogged = userIsLogged;
    }

    public get $localNotification(): Observable<ILocalNotification> {
        return this._$localNotification;
    }

    private subscribeToTopics(): Observable<void> {
        return this.storageService.getItem(StorageKeyEnum.NOTIFICATION_CHANNELS)
            .pipe(
                map((rawChannels?: string) => (JSON.parse(rawChannels || null) || [])),
                flatMap((channels: Array<string>) => (
                    channels.length > 0
                        ? zip(...(channels.map((channel: string) => this.fcm.subscribeToTopic(channel))))
                        : of(undefined)
                ))
            );
    }

    private handleLocalNotificationTapped(): void {
        this.unsubscribeLocalNotificationTapped();

        this.localNotificationTappedSubscription = this.localNotifications
            .on('click')
            .subscribe((data) => {
                this.handleNotification(data);
            });
    }

    private handleNotification(notification: ILocalNotification): void {
        // current page = Main Meny
        this._$localNotification.next(notification);

        if (this._userIsLogged) {
            this.ngZone.run(() => {
                // if we are not on Main Menu we redirect
                this.navService.setRoot(NavPathEnum.MAIN_MENU, {notification});
            });
        }
    }

    private handleFCMNotifications(): void {
        this.unsubscribeFCMNotifications();

        // show notification if it was sent while the app was in foreground
        this.FCMNotificationSubscription = from(this.fcm.onNotification())
            .pipe(
                filter((content) => !content.wasTapped),
                flatMap((fcmNotification) => zip(
                    this.getLocalNotificationNewId(),
                    of(fcmNotification)
                )),
                tap(([id, fcmNotification]: [number, INotificationPayload]) => {
                    this.scheduleLocalNotification(id, fcmNotification);
                })
            )
            .subscribe(() => {
                this.saveAllLocalNotifications();
            });
    }

    private getLocalNotificationNewId(): Observable<number> {
        return from(this.localNotifications.getIds())
            .pipe(
                map((ids: Array<number>) => (
                    ids.reduce((lastId, id) => ((!lastId || lastId < id) ? id : lastId), undefined)
                )),
                map((lastId: number) => lastId ? (lastId + 1) : 1)
            );
    }

    private saveAllLocalNotifications(): Observable<void> {
        return from(this.localNotifications.getAll())
            .pipe(
                flatMap((localNotifications: Array<ILocalNotification>) => (
                    this.storageService.setItem(StorageKeyEnum.LOCAL_NOTIFICATIONS, JSON.stringify(localNotifications))
                )),
                map(() => undefined)
            );
    }

    private scheduleLocalNotification(id: number, FCMNotification: INotificationPayload): void {
        this.localNotifications.schedule({
            id,
            ...NotificationService.createLocalFromFCMNotification(FCMNotification)
        });
    }

    private static createLocalFromFCMNotification(FCMNotification: INotificationPayload): ILocalNotification {
        return {
            title: FCMNotification.title,
            smallIcon: 'res://notification_icon',
            color: '030F4C',
            text: FCMNotification.body,
            ...(FCMNotification.image
                ? {icon: FCMNotification.image}
                : {}),
            foreground: true,
            data: {
                id: FCMNotification.id,
                type: FCMNotification.type,
            }
        };
    }

    private getTappedNotification(): Observable<ILocalNotification> {
        return from(this.fcm.getInitialPushPayload())
            .pipe(
                flatMap((initialPushPayload): Observable<ILocalNotification> => {
                    const {launchDetails} = cordova.plugins.notification.local || {};
                    const {id: tappedNotification} = launchDetails || {};

                    // a FCM notification was tapped to open the application
                    if (initialPushPayload) {
                        return of(NotificationService.createLocalFromFCMNotification(initialPushPayload));
                    }
                    // a local notification was tapped to open the application
                    else if (tappedNotification) {
                        return this.getStoredNotification(tappedNotification);
                    }
                    else {
                        return of(undefined);
                    }
                })
            );
    }

    private getStoredNotification(id: number): Observable<ILocalNotification> {
        return this.getStoredNotifications()
            .pipe(
                map((localNotifications: Array<ILocalNotification>) => (
                    localNotifications.find(({id: currentId}) => Number(currentId) === Number(id)))
                )
            );
    }

    private getStoredNotifications(): Observable<Array<ILocalNotification>> {
        return this.storageService.getItem(StorageKeyEnum.LOCAL_NOTIFICATIONS)
            .pipe(
                map((localNotificationsStr) => JSON.parse(localNotificationsStr || null) || [])
            );
    }

    private unsubscribeFCMNotifications(): void {
        if (this.FCMNotificationSubscription && !this.FCMNotificationSubscription.closed) {
            this.FCMNotificationSubscription.unsubscribe();
        }
        this.FCMNotificationSubscription = undefined;
    }

    private unsubscribeLocalNotificationTapped(): void {
        if (this.localNotificationTappedSubscription && !this.localNotificationTappedSubscription.closed) {
            this.localNotificationTappedSubscription.unsubscribe();
        }
        this.localNotificationTappedSubscription = undefined;
    }
}
