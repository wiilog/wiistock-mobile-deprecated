import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {ConnectPage} from '../connect/connect'
import {HttpClient} from '@angular/common/http';

/**
 * Generated class for the ParamsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-params',
    templateUrl: 'params.html',
})
export class ParamsPage {

    private URL: string;

    constructor(public navCtrl: NavController, public navParams: NavParams, public toastController: ToastController, public sqLiteProvider: SqliteProvider, public http: HttpClient) {
        this.sqLiteProvider.getAPI_URL().then((result) => {
            if (result !== null) {
                this.URL = result;
            } else {
                this.URL = '';
            }
        });
    }

    registerURL() {
        this.sqLiteProvider.setAPI_URL(this.URL).then((result) => {
            if (result === true) {
                this.showToast('URL enregistrée!');
            } else {
                console.log(result);
            }
        });
    }

    testURL() {
        let url: string = this.URL + 'ping';
        this.http.post<any>(url, {}).subscribe(
            res => {
                this.registerURL();
                this.showToast('URL correcte!').then(() => {
                    this.navCtrl.setRoot(ConnectPage);
                });
            },
            error => this.showToast('URL incorrecte...')
        );
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

    goToConnect() {
        this.navCtrl.push(ConnectPage);
    }
}
