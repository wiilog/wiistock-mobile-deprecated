import {Component} from '@angular/core';
import {Manutention} from '@entities/manutention';
import {ToastService} from '@app/common/services/toast.service';
import {ApiService} from '@app/common/services/api.service';
import {Network} from '@ionic-native/network/ngx';
import {LoadingService} from '@app/common/services/loading.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {AlertController} from '@ionic/angular';
import {from} from 'rxjs';
import {CanLeave} from '@app/guards/can-leave/can-leave';


@Component({
    selector: 'wii-manutention-validate',
    templateUrl: './manutention-validate.page.html',
    styleUrls: ['./manutention-validate.page.scss'],
})
export class ManutentionValidatePage implements CanLeave {
    public manutention: Manutention;
    public commentaire: string;
    public hasLoaded: boolean;
    public showCom: boolean = false;
    private sendCommentToApiLoading;

    public constructor(private alertController: AlertController,
                       private navService: NavService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private apiService: ApiService,
                       private network: Network,
                       private loadingService: LoadingService) {
        this.sendCommentToApiLoading = false;
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        if (navParams.get('manutention') !== undefined) {
            this.manutention = navParams.get('manutention');
        }
        this.synchronise();
    }

    public wiiCanLeave(): boolean {
        return !this.sendCommentToApiLoading;
    }

    public validateManut(): void {
        if (this.network.type !== 'none') {
            from(this.alertController.create({
                header: 'Commentez la validation',
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
            })).subscribe((alert: HTMLIonAlertElement) => {
                alert.present();
            });
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
                .subscribe((loading: HTMLIonLoadingElement) => {
                    this.apiService.requestApi('post', ApiService.VALIDATE_MANUT, {params}).subscribe(
                        (response) => {
                            this.sendCommentToApiLoading = false;
                            loading.dismiss();
                            if (response.success) {
                                this.sqliteService.deleteBy('`manutention`', this.manutention.id).subscribe(() => {
                                    this.navService.pop();
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
        this.sqliteService.findOneById('`manutention`', this.manutention.id).subscribe((manutention) => {
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
