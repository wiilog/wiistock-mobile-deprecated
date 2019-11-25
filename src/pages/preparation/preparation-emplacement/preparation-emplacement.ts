import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {ToastService} from '@app/services/toast.service';
import {Observable, Subscription} from 'rxjs';
import 'rxjs/add/observable/zip';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {flatMap} from 'rxjs/operators';
import {Network} from '@ionic-native/network';
import {of} from 'rxjs/observable/of';


@IonicPage()
@Component({
    selector: 'page-preparation-emplacement',
    templateUrl: 'preparation-emplacement.html',
})
export class PreparationEmplacementPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;

    public emplacement: Emplacement;
    public preparation: Preparation;

    private isLoading: boolean;

    private zebraScannerSubscription: Subscription;
    private validatePrepa: () => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService) {
        this.isLoading = false;
    }

    public ionViewWillEnter(): void {
        this.preparation = this.navParams.get('preparation');
        this.validatePrepa = this.navParams.get('validatePrepa');
        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewWillLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe(barcode => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public testIfBarcodeEquals(text): void {
        const foundEmplacement = this.searchComponent.isKnownLocation(text);

        if (foundEmplacement) {
            this.emplacement = foundEmplacement;
        }
        else {
            this.toastService.presentToast('Veuillez flasher ou sélectionner un emplacement connu.');
        }
    }

    public validate(): void {
        if (!this.isLoading) {
            if (this.emplacement.label !== '') {
                this.isLoading = true;
                    this.sqliteProvider
                        .findArticlesByPrepa(this.preparation.id)
                        .pipe(
                            flatMap((articles) => Observable.zip(
                                ...articles.map((article) => (
                                    this.sqliteProvider
                                        .findMvtByArticlePrepa(article.id)
                                        .pipe(flatMap((mvt) => this.sqliteProvider.finishMvt(mvt.id, this.emplacement.label)))
                                ))
                            )),

                            flatMap(() => this.storageService.addPrepa()),
                            flatMap(() => this.sqliteProvider.finishPrepa(this.preparation.id, this.emplacement.label)),
                            flatMap((): any => (
                                this.network.type !== 'none'
                                    ? this.localDataManager.saveFinishedProcess('preparation')
                                    : of({offline: true})
                            ))
                        )
                        .subscribe(
                            ({offline, success}: any) => {
                                if (offline) {
                                    this.toastService.presentToast('Préparation sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                    this.closeScreen();
                                }
                                else {
                                    this.handlePreparationsSuccess(success.length);
                                }
                            },
                            (error) => {
                                this.handlePreparationsError(error);
                            });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

    private handlePreparationsSuccess(nbPreparationsSucceed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.presentToast(
                (nbPreparationsSucceed === 1
                    ? 'Votre préparation a bien été enregistrée'
                    : `Votre préparation et ${nbPreparationsSucceed - 1} préparation${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handlePreparationsError(resp): void {
        this.isLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        if (resp.api) {
            throw resp;
        }
    }

    private closeScreen(): void {
        this.isLoading = false;
        this.navCtrl.pop().then(() => {
            this.validatePrepa();
        });
    }
}
