import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {UsersApiProvider} from '@providers/users-api/users-api';
import {MenuPage} from '@pages/menu/menu';
import {ParamsPage} from '@pages/params/params'
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';


@IonicPage()
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
    public connectURL: string = '/api/connect';
    public isLoaded: boolean;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public usersApiProvider: UsersApiProvider,
                       private toastService: ToastService,
                       public sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef) {
        this.isLoaded = false;
    }

    public logForm(): void {
        if (!this.isLoaded) {
            this.isLoaded = true;

            this.sqliteProvider.getAPI_URL().subscribe((result) => {
                if (result !== null) {
                    let url: string = result + this.connectURL;
                    this.usersApiProvider.setProvider(this.form, url).subscribe(
                        resp => {
                            if (resp.success) {
                                this.sqliteProvider.setOperateur(this.form.login);
                                this.sqliteProvider.resetDataBase().subscribe(
                                    () => {
                                        this.sqliteProvider.clearStorage().then(() => {
                                            this.sqliteProvider.setOperateur(this.form.login)
                                                .then(() => {
                                                    this.sqliteProvider.importData(resp.data)
                                                        .subscribe(
                                                            () => {
                                                                this.isLoaded = false;
                                                                this.navCtrl.setRoot(MenuPage);
                                                            },
                                                            () => {
                                                                this.finishLoading();
                                                            }
                                                        );
                                                })
                                                .catch(err => {
                                                    this.finishLoading();
                                                    console.log(err)
                                                });
                                        });
                                    },
                                    () => {
                                        this.finishLoading();
                                    });
                            }
                            else {
                                this.finishLoading();
                                this.toastService.showToast('Identifiants incorrects.');
                            }
                        },
                        () => {
                            this.finishLoading();
                            this.toastService.showToast('Un problème est survenu, veuillez vérifier vos identifiants ainsi que l\'URL saisie sans les paramètres.');
                        });
                }
                else {
                    this.finishLoading();
                    this.toastService.showToast('Veuillez configurer votre URL dans les paramètres.');
                }
            });
        }
    }

    public goToParams(): void {
        if (!this.isLoaded) {
            this.isLoaded = false;
            this.navCtrl.push(ParamsPage);
        }
    }

    private finishLoading() {
        this.isLoaded = false;
        this.changeDetector.detectChanges();
    }
}
