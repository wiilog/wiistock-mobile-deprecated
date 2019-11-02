import {Component, ViewChild} from '@angular/core';
import {AlertController, Content, IonicPage, NavController, NavParams} from 'ionic-angular';
import {Manutention} from '@app/entities/manutention';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {MenuPage} from '@pages/menu/menu';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';


@IonicPage()
@Component({
    selector: 'page-manutention-validate',
    templateUrl: 'manutention-validate.html',
})
export class ManutentionValidatePage {
    @ViewChild(Content)
    public content: Content;

    public manutention: Manutention;
    public validateManutApi = '/api/validateManut';
    public commentaire: string;
    public hasLoaded: boolean;
    public user: string;
    public showCom: boolean = false;

    public constructor(public alertController: AlertController,
                public navCtrl: NavController,
                public navParams: NavParams,
                public sqLiteProvider: SqliteProvider,
                public client: HttpClient,
                private toastService: ToastService,
                private network: Network) {
    }

    public ionViewWillEnter(): void {
        if (this.navParams.get('manutention') !== undefined) {
            this.manutention = this.navParams.get('manutention');
        }
        this.synchronise();
    }

    public validateManut(): void {
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

    public notifyApi(): void {
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
                        this.sqLiteProvider.deleteById('`manutention`', this.manutention.id).subscribe(() => {
                            this.navCtrl.pop();
                        })
                    } else {
                        this.toastService.showToast(response.msg);
                    }
                });
            });
        });
    }

    public synchronise(): void {
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

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public toDate(manutention: Manutention): Date {
        return new Date(manutention.date_attendue);
    }

    public showCommentaire(): void {
        this.showCom = !this.showCom;
    }
}
