import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {NavController, NavParams, ToastController} from 'ionic-angular';
import {UsersApiProvider} from "../../providers/users-api/users-api";
import {MenuPage} from "../menu/menu";
import {ParamsPage} from "../params/params"
import {SqliteProvider} from "../../providers/sqlite/sqlite";

@Component({
    selector: 'page-connect',
    templateUrl: 'connect.html',
    // to resolve ExpressionChangedAfterItHasBeenCheckedError error on emulator
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectPage {

    public form = {
        login: '',
        password: ''
    };
    public connectURL : string = '/api/connect';
    public isLoaded : boolean;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public usersApiProvider: UsersApiProvider,
                       private toastController: ToastController,
                       public sqliteProvider: SqliteProvider,
                       private changeDetector: ChangeDetectorRef) {
        this.isLoaded = false;
    }

    public logForm(): void {
        this.sqliteProvider.getAPI_URL().subscribe((result) => {
            this.isLoaded = true;
            if (result !== null) {
                let url : string = result + this.connectURL;
                this.usersApiProvider.setProvider(this.form, url).subscribe(resp => {
                    if (resp.success) {
                        this.sqliteProvider.setOperateur(this.form.login);
                        this.sqliteProvider.cleanDataBase().subscribe(() => {
                            this.sqliteProvider.clearStorage().then(() => {
                                this.sqliteProvider.importData(resp.data)
                                    .then(() => {
                                        this.isLoaded = false;
                                        this.navCtrl.setRoot(MenuPage);
                                    });
                            }).catch(err => console.log(err));
                        });
                    } else {
                        this.isLoaded = false;
                        this.showToast('Identifiants incorrects.');
                    }
                });
            } else {
                this.isLoaded = false;
                this.changeDetector.detectChanges();
                this.showToast('Veuillez configurer votre URL dans les paramètres.');
            }
        });
    }

    public async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

    public goToParams(): void {
        if (!this.isLoaded) {
            this.navCtrl.push(ParamsPage);
        }
    }

}
