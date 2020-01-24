import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {ParamsPage} from '@pages/params/params'
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ToastService} from '@app/services/toast.service';
import {Network} from '@ionic-native/network';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ApiService} from '@app/services/api.service';
import {VersionCheckerService} from '@app/services/version-checker.service';
import {flatMap, map, timeout} from 'rxjs/operators';
import {StorageService} from '@app/services/storage.service';
import {Subscription} from 'rxjs';
// @ts-ignore
import {env} from '../../environment';
// @ts-ignore
import {autoconnect, login, password} from '../../../credentials';

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
    private wantToAutoConnect: boolean;
    private appVersionSubscription: Subscription;
    private urlServerSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private versionChecker: VersionCheckerService,
                       private changeDetector: ChangeDetectorRef,
                       private network: Network,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
        this.loading = true;
        this.appVersionInvalid = false;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.wantToAutoConnect = Boolean(this.navParams.get('autoconnect'));
        this.urlServerSubscription = this.sqliteProvider.getServerUrl().subscribe((url) => {
            if (url) {
                this.appVersionSubscription = this.versionChecker.isAvailableVersion()
                    .pipe(
                        map((availableVersion) => ({
                            ...availableVersion,
                            apkUrl: `${url}/${ConnectPage.PATH_DOWNLOAD_APK}`
                        }))
                    )
                    .subscribe(
                        ({available, currentVersion, apkUrl}) => {
                            this.appVersionInvalid = !available;
                            this.currentVersion = currentVersion;
                            this.apkUrl = apkUrl;
                            this.finishLoading();
                            this.autoLoginIfAllowed();
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
                    .requestApi('post', ApiService.CONNECT, this.form, false)
                    .pipe(timeout(ApiService.VERIFICATION_SERVICE_TIMEOUT))
                    .subscribe(
                        ({data, success}) => {
                            if (success) {
                                const {apiKey, isInventoryManager} = data;
                                this.sqliteProvider
                                    .resetDataBase()
                                    .pipe(flatMap(() => this.storageService.initStorage(apiKey, this.form.login, isInventoryManager)))
                                    .subscribe(
                                        () => {
                                            this.loading = false;
                                            this.barcodeScannerManager.registerZebraBroadcastReceiver();
                                            this.navCtrl.setRoot(MainMenuPage, {needReload: false});
                                        },
                                        (err) => {
                                            this.finishLoading();
                                            console.log(err)
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
            this.navCtrl.push(ParamsPage);
        }
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }

    private autoLoginIfAllowed() {
        if (env === 'dev' && autoconnect && this.wantToAutoConnect) {
            this.form = {
                login: login,
                password: password
            };
            this.logForm();
        }
    }
}
