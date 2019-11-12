import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {UsersApiProvider} from '@providers/users-api/users-api';
import {MenuPage} from '@pages/menu/menu';
import {ParamsPage} from '@pages/params/params'
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';
import {Network} from '@ionic-native/network';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ApiServices} from '@app/config/api-services';
import {VersionCheckerService} from '@app/services/version-checker.service';
import {Subscription} from 'rxjs';
import {map} from 'rxjs/operators';


@IonicPage()
@Component({
    selector: 'page-connect',
    templateUrl: 'connect.html',
    // to resolve ExpressionChangedAfterItHasBeenCheckedError error on emulator
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectPage {

    private static readonly PATH_DOWNLOAD_APK: string = 'telecharger/nomade.apk';

    public form = {
        login: '',
        password: ''
    };
    public loading: boolean;
    public appVersionInvalid: boolean;
    public currentVersion: string;
    public apkUrl: string;

    private appVersionSubscription: Subscription;
    private urlServerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public usersApiProvider: UsersApiProvider,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private versionChecker: VersionCheckerService,
                       private changeDetector: ChangeDetectorRef,
                       private network: Network,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
        this.loading = false;
        this.appVersionInvalid = false;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.urlServerSubscription = this.sqliteProvider.getServerUrl().subscribe((url) => {
            if (url) {
                this.appVersionSubscription = this.versionChecker.isAvailableVersion()
                    .pipe(
                        map((availableVersion) => ({
                            ...availableVersion,
                            apkUrl: `${url}/${ConnectPage.PATH_DOWNLOAD_APK}`
                        }))
                    )
                    .subscribe(({isValid, currentVersion, apkUrl}) => {
                        this.appVersionInvalid = !isValid;
                        this.currentVersion = currentVersion;
                        this.apkUrl = apkUrl;
                        this.finishLoading();
                    });
            }
            else {
                this.loading = false;
                this.goToParams();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.appVersionSubscription) {
            this.appVersionSubscription.unsubscribe();
            this.appVersionSubscription = undefined;
        }
        if (this.urlServerSubscription) {
            this.urlServerSubscription.unsubscribe();
            this.urlServerSubscription = undefined;
        }
    }

    public logForm(): void {
        if (!this.loading) {
            if (this.network.type !== 'none') {
                this.loading = true;
                this.sqliteProvider.getApiUrl(ApiServices.CONNECT).subscribe((connectUrl) => {
                    this.usersApiProvider.setProvider(this.form, connectUrl).subscribe(
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
                                                                this.loading = false;
                                                                this.barcodeScannerManager.registerZebraBroadcastReceiver();
                                                                this.navCtrl.setRoot(MenuPage, {needReload : false});
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
                            } else {
                                this.finishLoading();
                                this.toastService.showToast('Identifiants incorrects.');
                            }
                        },
                        () => {
                            this.finishLoading();
                            this.toastService.showToast('Un problème est survenu, veuillez vérifier vos identifiants ainsi que l\'URL saisie sans les paramètres.');
                        });
                });
            } else {
                this.toastService.showToast('Vous devez être connecté à internet pour vous authentifier');
            }
        }
    }

    public goToParams(): void {
        if (!this.loading) {
            this.navCtrl.push(ParamsPage);
        }
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }
}
