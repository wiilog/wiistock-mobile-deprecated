import {Injectable} from '@angular/core';
import {AlertOptions} from '@ionic/core';
import {AlertController} from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    public static readonly CSS_CLASS_MANAGED_ALERT = 'custom-managed-alert';

    private audio: HTMLAudioElement;

    public constructor(private alertController: AlertController) {
        this.audio = new Audio('../../../assets/sounds/Error-sound.mp3');
        this.audio.load();
    }

    public async show(options: AlertOptions, onDismiss: () => void = null, sound: boolean = true) {
        const alert = await this.alertController.create(options);
        if(alert) {
            alert.onDidDismiss().then(onDismiss);

            if(sound) {
                this.audio.play();
            }
            alert.present().then((() => this.fixLinebreaks()));
        }

        return alert;
    }

    private fixLinebreaks() {
        const inputs = document.querySelectorAll(`ion-alert.${AlertService.CSS_CLASS_MANAGED_ALERT} .alert-message`);
        inputs.forEach((element: Element) => {
            element.innerHTML = element.innerHTML.replace(/\n/g, `<br>`);
        });
    }

}
