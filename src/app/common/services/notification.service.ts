import {Injectable} from '@angular/core';
import {StorageService} from '@app/common/services/storage/storage.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {FCM} from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';

declare let cordova: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    public constructor(private storage: StorageService, private fcm: FCM) {}

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
                cordova.plugins.notification.local.schedule({
                    id: id++,
                    title: content.title,
                    text: content.body,
                    foreground: true
                });
            }

            console.log(content);
        });
    }

}
