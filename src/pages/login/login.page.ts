import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {ApiService} from '@app/common/services/api.service';
import {ToastService} from '@app/common/services/toast.service';
import {Observable, of, Subscription} from 'rxjs';
import {filter, flatMap, map, mergeMap, take, tap} from 'rxjs/operators';
import {StorageService} from '@app/common/services/storage/storage.service';
import {VersionCheckerService} from '@app/common/services/version-checker.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {BarcodeScannerManagerService} from '@app/common/services/barcode-scanner-manager.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from '@environments/environment';
import {autoConnect, loginKey} from '../../dev-credentials.json';
import {PageComponent} from '@pages/page.component';
import {ServerImageKeyEnum} from '@app/common/components/server-image/server-image-key.enum';
import {ServerImageComponent} from '@app/common/components/server-image/server-image.component';
import {NotificationService} from '@app/common/services/notification.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {ILocalNotification} from '@ionic-native/local-notifications';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {UserService} from '@app/common/services/user.service';
import {NetworkService} from '@app/common/services/network.service';


@Component({
    selector: 'wii-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})
export class LoginPage extends PageComponent {

    @ViewChild('serverImageLogo')
    public serverImageLogo: ServerImageComponent;

    private static readonly PATH_DOWNLOAD_APK: string = 'telecharger/nomade.apk';
    public readonly LOGIN_IMAGE_KEY: ServerImageKeyEnum = ServerImageKeyEnum.LOGIN_IMAGE_KEY;

    public loginKey: string;

    public _loading: boolean;
    public appVersionInvalid: boolean;
    public currentVersion: string;

    public apkUrl: string;

    public tappedNotification: ILocalNotification;

    public loggedUser$: Observable<string>;
    public pendingDeposits: boolean = false;

    private wantToAutoConnect: boolean;
    private appVersionSubscription: Subscription;
    private urlServerSubscription: Subscription;
    private zebraSubscription: Subscription;
    private apiSubscription: Subscription;
    private notificationSubscription: Subscription;

    private passwordInputIsFocused: boolean;

    public constructor(private toastService: ToastService,
                       private apiService: ApiService,
                       private networkService: NetworkService,
                       private router: Router,
                       private splashScreen: SplashScreen,
                       private changeDetector: ChangeDetectorRef,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private sqliteService: SqliteService,
                       private activatedRoute: ActivatedRoute,
                       private versionChecker: VersionCheckerService,
                       private storageService: StorageService,
                       private notificationService: NotificationService,
                       navService: NavService) {
        super(navService);
        this.loading = true;
        this.appVersionInvalid = false;
        this.passwordInputIsFocused = false;
    }

    public ionViewWillEnter(): void {
        this.storageService.getString(StorageKeyEnum.OPERATOR_ID).pipe(
            take(1),
            filter(Boolean),
            map(operator => ({params: {operator}})),
            mergeMap(params => this.apiService.requestApi(ApiService.GET_PREVIOUS_OPERATOR_MOVEMENTS, params))
        ).subscribe(data => {
            this.pendingDeposits = data.movements.length > 0;
        });

        if(this.serverImageLogo) {
            this.serverImageLogo.reload();
        }
        const autoConnect = this.currentNavParams.get('autoConnect');
        this.wantToAutoConnect = (typeof autoConnect === 'boolean' ? autoConnect : true);

        this.barcodeScannerManager.registerZebraBroadcastReceiver();
        this.notificationService.userIsLogged = false;

        this.loggedUser$ = this.storageService.getString(StorageKeyEnum.OPERATOR, UserService.MAX_PSEUDO_LENGTH);

        this.unsubscribeZebra();
        this.zebraSubscription = this.barcodeScannerManager
            .zebraScan$
            .pipe(
                filter((barCode: string) => (
                    barCode
                    && barCode.length > 1
                    && !this.loading
                )),
                map((barCode: string) => {
                    const splitBarcode = barCode.split('\n');
                    return (splitBarcode && splitBarcode[0]) || '';
                })
            )
            .subscribe((barCode: string) => {
                this.fillForm(barCode);
            });

        this.urlServerSubscription = this.storageService.getString(StorageKeyEnum.URL_SERVER).subscribe((url) => {
            if(url) {
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
                            this.toastService.presentToast('Erreur : la liaison avec le serveur est impossible', {duration: ToastService.LONG_DURATION});
                        });
            } else {
                this.toastService.presentToast('Veuillez mettre à jour l\'url', {duration: ToastService.LONG_DURATION});
                this.finishLoading();
                this.goToParams();
            }
        });

        this.notificationSubscription = this.notificationService
            .$localNotification
            .subscribe((notification) => {
                this.tappedNotification = notification;
            });

        const where = [
            `type LIKE 'prise'`,
            `finished = 0`,
        ];

        this.sqliteService.findBy('mouvement_traca', where).subscribe(result => {
            this.pendingDeposits = result;
        })
    }

    public ionViewWillLeave(): void {
        this.unsubscribeZebra();
        this.unsubscribeApi();
        this.unsubscribeNotification();
        if(this.appVersionSubscription) {
            this.appVersionSubscription.unsubscribe();
            this.appVersionSubscription = undefined;
        }
        if(this.urlServerSubscription) {
            this.urlServerSubscription.unsubscribe();
            this.urlServerSubscription = undefined;
        }
    }

    public logForm(): void {
        if(!this.loading && this.loginKey) {
            if(this.networkService.hasNetwork()) {
                this.loading = true;

                this.unsubscribeApi();

                this.apiSubscription = this.apiService
                    .requestApi(ApiService.POST_API_KEY, {
                        params: {loginKey: this.loginKey},
                        secured: false,
                        timeout: true
                    })
                    .pipe(
                        flatMap(({data, success}) => {
                            if(success) {
                                const {apiKey, rights, userId, username, notificationChannels, parameters} = data;

                                return this.sqliteService
                                    .resetDataBase()
                                    .pipe(
                                        flatMap(() => this.storageService.initStorage(apiKey, username, userId, rights, notificationChannels, parameters)),
                                        tap(() => {
                                            this.loginKey = '';
                                        }),
                                        flatMap(() => this.notificationService.initialize()),
                                        flatMap((notificationOptions) => {
                                            this.notificationService.userIsLogged = true;
                                            const {notification} = notificationOptions || {};
                                            return this.navService.setRoot(NavPathEnum.MAIN_MENU, {
                                                notification: this.tappedNotification || notification
                                            });
                                        }),
                                        map(() => ({success: true}))
                                    )
                            } else {
                                return of({success: false})
                            }
                        })
                    )
                    .subscribe(
                        ({success}) => {
                            this.finishLoading();
                            if(!success) {
                                this.toastService.presentToast('Identifiants incorrects.');
                            }
                        },
                        () => {
                            this.finishLoading();
                            this.toastService.presentToast('Un problème est survenu, veuillez vérifier la connexion, vos identifiants et l\'URL saisie dans les paramètres', {duration: ToastService.LONG_DURATION});
                        });
            } else {
                this.toastService.presentToast('Vous devez être connecté à internet pour vous authentifier');
            }
        }
    }

    public goToParams(): void {
        if(!this.loading) {
            this.navService.push(NavPathEnum.PARAMS);
        }
    }

    public set loading(loading: boolean) {
        this._loading = loading;
        if(this._loading) {
            this.splashScreen.show();
        } else {
            this.splashScreen.hide();
        }
    }

    public get loading(): boolean {
        return this._loading;
    }

    public fillForm(key: string): void {
        this.loginKey = key;
        this.logForm();
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }

    private autoLoginIfAllowed() {
        if(!environment.production
            && autoConnect
            && this.wantToAutoConnect) {
            this.fillForm(loginKey);
        }
    }

    private unsubscribeZebra(): void {
        if(this.zebraSubscription) {
            this.zebraSubscription.unsubscribe();
            this.zebraSubscription = undefined;
        }
    }

    private unsubscribeApi(): void {
        if(this.apiSubscription) {
            this.apiSubscription.unsubscribe();
            this.apiSubscription = undefined;
        }
    }

    private unsubscribeNotification(): void {
        if(this.notificationSubscription && !this.notificationSubscription.closed) {
            this.notificationSubscription.unsubscribe();
        }
        this.notificationSubscription = undefined;
    }
}
