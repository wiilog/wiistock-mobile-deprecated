import {ChangeDetectorRef, Component} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import {ToastService} from '@app/common/services/toast.service';
import {Subscription} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {StorageService} from '@app/common/services/storage.service';
import {VersionCheckerService} from '@app/common/services/version-checker.service';
import {Network} from '@ionic-native/network/ngx';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {BarcodeScannerManagerService} from '@app/common/services/barcode-scanner-manager.service';
import {NavService} from '@app/common/services/nav.service';
import {ParamsPageRoutingModule} from '@pages/params/params-routing.module';
import {MainMenuPageRoutingModule} from '@pages/main-menu/main-menu-routing.module';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {ActivatedRoute} from '@angular/router';
import {environment} from '@environments/environment';
import {autoConnect, login, password} from '../../dev-credentials.json';
import {PageComponent} from '@pages/page.component';


@Component({
    selector: 'wii-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage extends PageComponent {

    private static readonly PATH_DOWNLOAD_APK: string = 'telecharger/nomade.apk';

    public form = {
        login: '',
        password: ''
    };
    public _loading: boolean;
    public appVersionInvalid: boolean;
    public currentVersion: string;

    public environment = environment;

    public apkUrl: string;
    private wantToAutoConnect: boolean;
    private appVersionSubscription: Subscription;
    private urlServerSubscription: Subscription;

    public constructor(private toastService: ToastService,
                       private apiService: ApiService,
                       private network: Network,
                       private splashScreen: SplashScreen,
                       private changeDetector: ChangeDetectorRef,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private versionChecker: VersionCheckerService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
        this.appVersionInvalid = false;
    }

    public ionViewWillEnter(): void {
        const autoConnect = this.currentNavParams.get('autoConnect');

        this.wantToAutoConnect = (typeof autoConnect === 'boolean' ? autoConnect : true);
        this.urlServerSubscription = this.storageService.getServerUrl().subscribe((url) => {
            if (url) {
                this.appVersionSubscription = this.versionChecker.isAvailableVersion()
                    .pipe(
                        map((availableVersion) => ({
                            ...availableVersion,
                            apkUrl: `${url}/${LoginPage.PATH_DOWNLOAD_APK}`
                        }))
                    )
                    .subscribe(
                        ({available, currentVersion, apkUrl}) => {
                            this.appVersionInvalid = !available;
                            this.currentVersion = currentVersion;
                            this.apkUrl = apkUrl;
                            this.finishLoading();
                            setTimeout(() => {
                                this.autoLoginIfAllowed();
                            });
                        },
                        () => {
                            this.finishLoading();
                            this.toastService.presentToast('Erreur : la liaison avec le serveur est impossible', ToastService.LONG_DURATION);
                        });
            } else {
                this.toastService.presentToast('Veuillez mettre à jour l\'url', ToastService.LONG_DURATION);
                this.finishLoading();
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
                this.apiService
                    .requestApi('post', ApiService.CONNECT, {params: this.form, secured: false, timeout: true})
                    .subscribe(
                        ({data, success}) => {
                            if (success) {
                                const {apiKey, rights, userId} = data;
                                this.sqliteService
                                    .resetDataBase()
                                    .pipe(flatMap(() => this.storageService.initStorage(apiKey, this.form.login, userId, rights)))
                                    .subscribe(
                                        () => {
                                            this.form.password = '';
                                            this.barcodeScannerManager.registerZebraBroadcastReceiver();

                                            this.navService.setRoot(MainMenuPageRoutingModule.PATH, {needReload: false}).subscribe(() => {
                                                this.loading = false;
                                            });
                                        },
                                        () => {
                                            this.finishLoading();
                                        });
                            } else {
                                this.finishLoading();
                                this.toastService.presentToast('Identifiants incorrects.');
                            }
                        },
                        () => {
                            this.finishLoading();
                            this.toastService.presentToast('Un problème est survenu, veuillez vérifier la connexion, vos identifiants et l\'URL saisie dans les paramètres', ToastService.LONG_DURATION);
                        });
            } else {
                this.toastService.presentToast('Vous devez être connecté à internet pour vous authentifier');
            }
        }
    }

    public goToParams(): void {
        if (!this.loading) {
            this.navService.push(ParamsPageRoutingModule.PATH);
        }
    }

    public set loading(loading: boolean) {
        this._loading = loading;
        if (this._loading) {
            this.splashScreen.show();
        }
        else {
            this.splashScreen.hide();
        }
    }

    public get loading(): boolean {
        return this._loading;
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }

    private autoLoginIfAllowed() {
        if (!environment.production
            && autoConnect
            && this.wantToAutoConnect) {
            this.form = {
                login: login,
                password: password
            };
            this.logForm();
        }
    }
}
