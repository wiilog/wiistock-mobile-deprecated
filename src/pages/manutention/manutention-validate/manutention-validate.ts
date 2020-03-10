import {Component} from '@angular/core';
import {AlertController, IonicPage, Loading, NavController, NavParams} from 'ionic-angular';
import {Manutention} from '@app/entities/manutention';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Network} from '@ionic-native/network';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from "@app/services/api.service";
import {LoadingService} from "@app/services/loading.service";


@IonicPage()
@Component({
    selector: 'page-manutention-validate',
    templateUrl: 'manutention-validate.html',
})
export class ManutentionValidatePage {
    public manutention: Manutention;
    public commentaire: string;
    public hasLoaded: boolean;
    public showCom: boolean = false;
    private sendCommentToApiLoading;

    public constructor(private alertController: AlertController,
                       private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private network: Network,
                       private loadingService: LoadingService) {
        this.sendCommentToApiLoading = false;
    }

    public ionViewWillEnter(): void {
        if (this.navParams.get('manutention') !== undefined) {
            this.manutention = this.navParams.get('manutention');
        }
        this.synchronise();
    }

    public ionViewCanLeave(): boolean {
        return !this.sendCommentToApiLoading;
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
                    handler: (commentaire) => {
                        this.commentaire = commentaire.commentaire;
                        this.notifyApi();
                    },
                    cssClass: 'alert-success'
                }]
            }).present();
        } else {
            this.toastService.presentToast('Vous devez être connecté à internet pour valider la demande');
        }
    }

    public notifyApi(): void {
        if (!this.sendCommentToApiLoading) {
            this.sendCommentToApiLoading = true;
            let params = {
                id: this.manutention.id,
                commentaire: this.commentaire
            };
            this.loadingService
                .presentLoading('Sauvegarde de la manutention...')
                .subscribe((loading: Loading) => {
                    this.apiService.requestApi('post', ApiService.VALIDATE_MANUT, {params}).subscribe(
                        (response) => {
                            this.sendCommentToApiLoading = false;
                            loading.dismiss();
                            if (response.success) {
                                this.sqliteProvider.deleteBy('`manutention`', this.manutention.id).subscribe(() => {
                                    this.navCtrl.pop();
                                })
                            }
                            else {
                                this.toastService.presentToast(response.msg);
                            }
                        },
                        () => {
                            loading.dismiss();
                        });
                });
        }
    }

    public synchronise(): void {
        this.hasLoaded = false;
        this.sqliteProvider.findOneById('`manutention`', this.manutention.id).subscribe(manutention => {
            this.manutention = manutention;
            this.hasLoaded = true;
        })
    }

    public toDate(manutention: Manutention): Date {
        return new Date(manutention.date_attendue);
    }

    public showCommentaire(): void {
        this.showCom = !this.showCom;
    }
}
