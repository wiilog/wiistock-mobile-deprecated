import {Injectable, NgZone} from '@angular/core';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {NavService} from "./nav.service";
import {Platform} from '@ionic/angular';
import {from, Observable, of, Subscription, zip} from 'rxjs';
import {filter, flatMap, map, tap} from 'rxjs/operators';
import {INotificationPayload} from 'cordova-plugin-fcm-with-dependecy-updated';
import {ILocalNotification} from '@ionic-native/local-notifications';

declare let cordova: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private FCMNotificationSubscription: Subscription;
    private localNotificationTappedSubscription: Subscription;

    public constructor(private storageService: StorageService,
                       private platform: Platform,
                       private fcm: FCM,
                       private ngZone: NgZone,
                       private localNotifications: LocalNotifications,
                       private navService: NavService) {}

    public initialize(): Observable<void> {
        return from(this.platform.ready()).pipe(
            flatMap(() => this.fcm.deleteInstanceId()),
            flatMap(() => this.subscribeToTopics()),
            flatMap(() => {
                return this.getClickedNotificationData()
                    .pipe(
                        filter(Boolean),
                        flatMap((notification) => this.handleNotification(notification))
                    );
            }),
            tap(() => {
                this.handleFCMNotifications();
                this.handleLocalNotificationTapped();
            }),
            map(() => undefined)
        );
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

    private handleNotification(notification: ILocalNotification|INotificationPayload): Observable<void> {
        // TODO avec ngZone ?
        return of(undefined);
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
                map((lastId: number) => lastId ? lastId : 1)
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

    private scheduleLocalNotification(id: number, fcmNotification: INotificationPayload): void {
        this.localNotifications.schedule({
            id: ++id,
            title: fcmNotification.title,
            smallIcon: 'res://notification_icon',
            color: '030F4C',
            text: fcmNotification.body,
            ...(fcmNotification.image
                ? {icon: fcmNotification.image}
                : {}),
            foreground: true,
            data: {
                id: fcmNotification.id,
                type: fcmNotification.type,
            }
        });
    }

    private getClickedNotificationData(): Observable<INotificationPayload|ILocalNotification> {
        return from(this.fcm.getInitialPushPayload())
            .pipe(
                flatMap((initialPushPayload): Observable<INotificationPayload|ILocalNotification> => {
                    const {launchDetails} = cordova.plugins.notification.local || {};
                    const {id: tappedNotification} = launchDetails || {};

                    // a FCM notification was tapped to open the application
                    if (initialPushPayload) {
                        return of(initialPushPayload);
                    }
                    // a local notification was tapped to open the application
                    else if (tappedNotification) {
                        return this.getStoredNotification(tappedNotification);
                    }
                    else {
                        return undefined;
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
