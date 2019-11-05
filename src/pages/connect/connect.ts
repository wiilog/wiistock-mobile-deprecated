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
import {Subscription} from "rxjs";
import {flatMap} from 'rxjs/operators';
import {StorageService} from '@app/services/storage.service';


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
    public loading: boolean;
    public appVersionInvalid: boolean;
    private appVersionSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public usersApiProvider: UsersApiProvider,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private versionChecker: VersionCheckerService,
                       private changeDetector: ChangeDetectorRef,
                       private network: Network,,
                       private storageService: StorageService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {
        this.loading = true;
        this.appVersionInvalid = false;
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.appVersionSubscription = this.versionChecker.isAvailableVersion().subscribe((isValid) => {
            this.appVersionInvalid = !isValid;
            this.finishLoading();
        });
    }

    public ionViewWillLeave(): void {
        if (this.appVersionSubscription) {
            this.appVersionSubscription.unsubscribe();
            this.appVersionSubscription = undefined;
        }
    }

    public logForm(): void {
        if (!this.loading) {
            if (this.network.type !== 'none') {
                this.loading = true;
                this.sqliteProvider.getApiUrl(ApiServices.CONNECT).subscribe((connectUrl) => {
                    this.usersApiProvider.setProvider(this.form, connectUrl).subscribe(
                        ({data, success}) => {
                            if (success) {
                                const {apiKey, isInventoryManager} = data;
                                this.sqliteProvider
                                    .resetDataBase()
                                    .pipe(flatMap(() => this.storageService.initStorage(apiKey, this.form.login, isInventoryManager)))
                                    .subscribe(
                                        () => {
                                            this.loading = false;
                                            this.navCtrl.setRoot(MenuPage, {needReload : false});
                                        },
                                        (err) => {
                                            this.finishLoading();
                                            console.log(err)
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
            this.loading = false;
            this.navCtrl.push(ParamsPage);
        }
    }

    private finishLoading() {
        this.loading = false;
        this.changeDetector.detectChanges();
    }
}
