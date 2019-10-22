import {Component, ViewChild} from '@angular/core';
import {AlertController, Content, IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {Manutention} from "@app/entities/manutention";
import {SqliteProvider} from "@providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ManutentionMenuPage} from "@pages/manutention/manutention-menu/manutention-menu";
import {MenuPage} from "@pages/menu/menu";

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
    dataApi: string = '/api/getData';
    commentaire : string;
    hasLoaded : boolean;
    user : string;
    showCom : boolean = false;

    constructor(public alertController : AlertController, public navCtrl: NavController, public navParams: NavParams, public sqLiteProvider: SqliteProvider, public client : HttpClient, public toastController : ToastController) {
        if (navParams.get('manutention') !== undefined) {
            this.manutention = navParams.get('manutention');
        }
    }

    ionViewDidLoad() {
        this.synchronise(true);
    }

    validateManut() {
        this.alertController.create({
            title:'Commentez la validation',
            inputs:[{
                name:'commentaire',
                placeholder: 'Commentaire',
                type: 'text'
            }],
            buttons:[{
                text: 'Valider',
                handler: commentaire =>{
                    this.commentaire = commentaire.commentaire;
                    this.notifyApi();
                },
                cssClass : 'alert'
            }]
        }).present();
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

    notifyApi() {
        this.sqLiteProvider.getAPI_URL().subscribe((result) => {
            this.sqLiteProvider.getApiKey().then((key) => {
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

    synchronise(fromStart: boolean) {
        this.hasLoaded = false;
        this.sqLiteProvider.getAPI_URL().subscribe(
            (result) => {
                if (result !== null) {
                    let url: string = result + this.dataApi;
                    this.sqLiteProvider.getApiKey().then((key) => {
                        this.client.post<any>(url, {apiKey: key}).subscribe(resp => {
                            if (resp.success) {
                                this.sqLiteProvider.cleanDataBase(fromStart).subscribe(() => {
                                    this.sqLiteProvider.importData(resp.data, true)
                                        .then(() => {
                                            this.sqLiteProvider.getOperateur().then((username) => {
                                                this.user = username;
                                                this.sqLiteProvider.findOne('`manutention`', this.manutention.id).subscribe(manutention => {
                                                    this.manutention = manutention;
                                                    setTimeout(() => {
                                                        this.hasLoaded = true;
                                                        this.content.resize();
                                                    }, 1000);
                                                });
                                            });
                                        });
                                });
                            } else {
                                this.hasLoaded = true;
                                this.showToast('Erreur');
                            }
                        }, error => {
                            this.hasLoaded = true;
                            this.showToast('Erreur réseau');
                        });
                    });
                } else {
                    this.showToast('Veuillez configurer votre URL dans les paramètres.')
                }
            },
            err => console.log(err)
        );
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    toDate(manutention : Manutention) {
        return new Date(manutention.date_attendue);
    }

    htmlToPlaintext(text) {
        return text ? String(text).replace(/<[^>]+>/gm, ' ') : '';
    }

    showCommentaire() {
        this.showCom = !this.showCom;
    }
}
