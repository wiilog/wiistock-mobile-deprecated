import {Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {UsersApiProvider} from "../../providers/users-api/users-api";
import {MenuPage} from "../menu/menu";
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

    constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider, private toastController: ToastController, public sqliteProvider: SqliteProvider) {
    }

    logForm() {
        this.usersApiProvider.setProvider(this.form).subscribe(resp => {
            if (resp.success) {
                this.sqliteProvider.setOperateur(this.form.login);
                this.sqliteProvider.cleanDataBase()
                    .then(() => {
                        this.sqliteProvider.clearStorage().then(() => {
                            this.sqliteProvider.importData(resp.data)
                                .then(() => {
                                    console.log('connect');
                                    this.navCtrl.push(MenuPage);
                                });
                        }).catch(err => console.log(err));
                    });
            } else {
                this.showToast('Identifiants incorrects...');
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

}
