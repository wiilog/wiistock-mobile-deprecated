import {Injectable, NgZone} from '@angular/core';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';
import {LocalNotifications} from '@ionic-native/local-notifications/ngx';
import {NavService} from "./nav.service";
import {DispatchMenuPage} from "../../../pages/tracking/dispatch/dispatch-menu/dispatch-menu.page";
import {NavPathEnum} from "./nav/nav-path.enum";

declare let cordova: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    click: any;
    public constructor(private storage: StorageService,
                       private fcm: FCM,
                       private ngZone: NgZone,
                       private localNotifications: LocalNotifications,
                       private navService: NavService) {}

    public async initialize() {
        const rawChannels = await this.storage.getItem(StorageKeyEnum.NOTIFICATION_CHANNELS).toPromise() || null;
        const channels = JSON.parse(rawChannels) || [];

        await this.fcm.deleteInstanceId();
        for(const channel of channels) {
            await this.fcm.subscribeToTopic(channel);
        }

        let id = 0;
        this.fcm.onNotification().subscribe((content) => {
            // show notification if it was sent while the app was in foreground
            if (!content.wasTapped) {
                this.unsubClick();
                this.click = this.localNotifications.on('click').subscribe(data => {
                    this.storage.setItem(StorageKeyEnum.REDIRECT_PAGE, content.type).subscribe(() => {
                        this.storage.setItem(StorageKeyEnum.REDIRECT_ID, content.id).subscribe(() => {
                            this.unsubClick();
                            this.ngZone.run(() => {
                                alert('TUTUTE');
                                this.navService.setRoot(NavPathEnum.MAIN_MENU);
                            });
                        });
                    });
                });
                this.localNotifications.schedule({
                    id: id++,
                    title: content.title,
                    text: content.body,
                    foreground: true,
                    data: {
                        id: content.id,
                        type: content.type,
                    }
                });
            } else {
                console.log('gfdgdgdg');
                this.storage.setItem(StorageKeyEnum.REDIRECT_PAGE, content.type).subscribe(() => {
                    this.storage.setItem(StorageKeyEnum.REDIRECT_ID, content.id).subscribe(() => {
                        alert('TUTUTE');
                    });
                });
            }
        });
    }

    private unsubClick() {
        if (this.click) {
            this.click.unsubscribe();
            this.click = undefined;
        }
    }

}
