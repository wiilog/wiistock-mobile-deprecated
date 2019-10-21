import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {Manutention} from "@app/entities/manutention";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";

/**
 * Generated class for the ManutentionValidatePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-manutention-validate',
    templateUrl: 'manutention-validate.html',
})
export class ManutentionValidatePage {

    manutention: Manutention;
    validateManutApi = '/api/validateManut';
    commentaire : string;

    constructor(public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider, public client : HttpClient, public toastController : ToastController) {
        if (navParams.get('manutention') !== undefined) {
            this.manutention = navParams.get('manutention');
        }
    }

    validateManut() {
        this.sqliteProvider.getAPI_URL().subscribe((result) => {
            this.sqliteProvider.getApiKey().then((key) => {
                let url: string = result + this.validateManutApi;
                let params = {
                    id : this.manutention.id,
                    apiKey : key,
                    commentaire : this.commentaire
                };
                console.log(this.commentaire);
                this.client.post<any>(url, params).subscribe((response) =>{
                    if (response.success) {
                        this.navCtrl.setRoot(ManutentionMenuPage);
                    } else {
                        this.showToast(response.msg);
                    }
                });
            });
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
