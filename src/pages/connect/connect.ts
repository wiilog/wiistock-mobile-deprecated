import {Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {UsersApiProvider} from "../../providers/users-api/users-api";
import {MenuPage} from "../menu/menu";
import {ParamsPage} from "../params/params"
import {SqliteProvider} from "../../providers/sqlite/sqlite";

@Component({
    selector: 'page-connect',
    templateUrl: 'connect.html',
})
export class ConnectPage {

    form = {
        login: '',
        password: ''
    };
    connectURL : string = '/api/connect';
    hasLoaded : boolean;

    constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider, private toastController: ToastController, public sqliteProvider: SqliteProvider) {
        this.hasLoaded = false;
    }

    logForm() {
        this.sqliteProvider.getAPI_URL().then((result) => {
            this.hasLoaded = true;
            if (result !== null) {
                let url : string = result + this.connectURL;
                this.usersApiProvider.setProvider(this.form, url).subscribe(resp => {
                    if (resp.success) {
                        this.sqliteProvider.setOperateur(this.form.login);
                        this.sqliteProvider.cleanDataBase()
                            .then(() => {
                                this.sqliteProvider.clearStorage().then(() => {
                                    this.sqliteProvider.importData(resp.data)
                                        .then(() => {
                                            console.log('connect');
                                            this.navCtrl.setRoot(MenuPage);
                                        });
                                }).catch(err => console.log(err));
                            });
                    } else {
                        this.showToast('Identifiants incorrects...');
                        this.hasLoaded = false;
                    }
                });
            } else {
                this.showToast('Aucune configuration URL...');
                this.hasLoaded = false;
            }
        });
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

    public goToParams() {
        if (!this.hasLoaded) {
            this.navCtrl.push(ParamsPage);
        }
    }

}
