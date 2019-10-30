import {Component, ViewChild} from '@angular/core';
import {AlertController, Content, IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {Manutention} from "@app/entities/manutention";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";
import {MenuPage} from "@pages/menu/menu";
import {Network} from "@ionic-native/network";
import {ToastService} from "@app/services/toast.service";

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
    @ViewChild(Content) content: Content;
    manutention: Manutention;
    validateManutApi = '/api/validateManut';
    dataApi: string = '/api/getManut';
    commentaire: string;
    hasLoaded: boolean;
    user: string;
    showCom: boolean = false;

    constructor(public alertController: AlertController,
                public navCtrl: NavController,
                public navParams: NavParams,
                public sqLiteProvider: SqliteProvider,
                public client: HttpClient,
                public toastController: ToastController,
                private toastService: ToastService,
                private network: Network) {
    }

    public ionViewWillEnter(): void {
        if (this.navParams.get('manutention') !== undefined) {
            this.manutention = this.navParams.get('manutention');
        }
        this.synchronise(true);
    }

    validateManut() {
        if (this.network.type !== 'none') {
            this.alertController.create({
                title: 'Commentez la validation',
                inputs: [{
                    name: 'commentaire',
                    placeholder: 'Commentaire',
                    type: 'text'
                }],
                buttons: [{
                    text: 'Valider',
                    handler: commentaire => {
                        this.commentaire = commentaire.commentaire;
                        this.notifyApi();
                    },
                    cssClass: 'alertAlert'
                }]
            }).present();
        } else {
            this.toastService.showToast('Vous devez être connecté à internet pour valider la demande');
        }
    }

    notifyApi() {
        this.sqLiteProvider.getAPI_URL().subscribe((result) => {
            this.sqLiteProvider.getApiKey().then((key) => {
                let url: string = result + this.validateManutApi;
                let params = {
                    id: this.manutention.id,
                    apiKey: key,
                    commentaire: this.commentaire
                };
                this.client.post<any>(url, params).subscribe((response) => {
                    if (response.success) {
                        this.navCtrl.setRoot(ManutentionMenuPage);
                    } else {
                        this.toastService.showToast(response.msg);
                    }
                });
            });
        });
    }

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqLiteProvider.findOneById('`manutention`', this.manutention.id).subscribe(manutention => {
            this.manutention = manutention;
            this.sqLiteProvider.getOperateur().then((userName) => {
                this.user = userName;
                this.hasLoaded = true;
                this.content.resize();
            });
        })
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    toDate(manutention: Manutention) {
        return new Date(manutention.date_attendue);
    }

    htmlToPlaintext(text) {
        return text ? String(text).replace(/<[^>]+>/gm, ' ') : '';
    }

    showCommentaire() {
        this.showCom = !this.showCom;
    }
}
