import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {HttpClient} from '@angular/common/http';
import {ToastService} from '@app/services/toast.service';
import {Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {StorageService} from "@app/services/storage.service";
import {LocalDataManagerService} from "@app/services/local-data-manager.service";
import {flatMap} from "rxjs/operators";


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

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public barcodeScannerManager: BarcodeScannerManagerService,
                       public http: HttpClient,
                       private toastService: ToastService,
                       private storageService: StorageService,
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
            this.toastService.showToast('Veuillez flasher ou sélectionner un emplacement connu.');
        }
    }

    public validate(): void {
        if (!this.isLoading) {
            if (this.emplacement.label !== '') {
                this.isLoading = true;
                let instance = this;
                let promise = new Promise<any>((resolve) => {
                    this.sqliteProvider.findArticlesByPrepa(this.preparation.id).subscribe((articles) => {
                        articles.forEach(function (article) {
                            instance.sqliteProvider.findMvtByArticle(article.id).subscribe((mvt) => {
                                instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).subscribe(() => {
                                    if (articles.indexOf(article) === articles.length - 1) resolve();
                                });
                            });
                        });
                    });
                });
                promise.then(() => {
                    this.storageService.addPrepa()
                        .pipe(
                            flatMap(() => this.sqliteProvider.finishPrepa(this.preparation.id, this.emplacement.label)),
                            flatMap(() => this.localDataManager.saveFinishedPrepas()),
                        )
                        .subscribe(
                            ({success, errors}) => {
                                this.handlePreparationSuccess(success.length, errors.length);
                            },
                            (error) => {
                                this.handlePreparationError(error);
                            });
                });
            }
            else {
                this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

    private handlePreparationSuccess(nbPreparationsSucceed: number, nbPreparationsFailed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.showToast(
                nbPreparationsFailed > 0
                    ? `${nbPreparationsSucceed} préparation${nbPreparationsSucceed > 1 ? 's ont bien été enregistrées' : ' a bien été entegistrée'}`
                    : (nbPreparationsSucceed === 1
                        ? 'Votre préparation a bien été enregistrée'
                        : `Votre préparation et ${nbPreparationsSucceed - 1} préparation${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.isLoading = false;
        this.navCtrl.pop().then(() => {
            this.validatePrepa();
        });
    }

    private handlePreparationError(resp): void {
        this.isLoading = false;
        this.toastService.showToast((resp && resp.message) ? resp.message : 'Une erreur s\'est produite');
    }
}
