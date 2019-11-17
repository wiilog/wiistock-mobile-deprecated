import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Livraison} from '@app/entities/livraison';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Observable, Subscription} from 'rxjs';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {flatMap} from 'rxjs/operators';
import 'rxjs/add/observable/zip';
import {of} from 'rxjs/observable/of';
import {Network} from '@ionic-native/network';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';


@IonicPage()
@Component({
    selector: 'page-livraison-emplacement',
    templateUrl: 'livraison-emplacement.html',
})
export class LivraisonEmplacementPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;

    public emplacement: Emplacement;
    public livraison: Livraison;

    private validateIsLoading: boolean;
    private validateLivraison: () => void;
    private zebraScannerSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService) {
        this.validateIsLoading = false;
    }

    public ionViewWillEnter(): void {
        this.validateLivraison = this.navParams.get('validateLivraison');
        this.livraison = this.navParams.get('livraison');

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testLocation(barcode);
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
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testLocation(barcode);
        });
    }

    public testLocation(locationToTest: string): void {
        const location = this.searchComponent.isKnownLocation(locationToTest);
        if (location) {
            if (this.livraison.emplacement === locationToTest) {
                this.emplacement = location;
            }
            else {
                this.toastService.showToast("Vous n'avez pas scanné le bon emplacement (destination demandée : " + this.livraison.emplacement + ")")
            }
        }
        else {
            this.toastService.showToast('Veuillez scanner ou sélectionner un emplacement connu.');
        }
    }

    public validate(): void {
        if (!this.validateIsLoading) {
            if (this.emplacement && this.emplacement.label !== '') {
                if (this.livraison.emplacement !== this.emplacement.label) {
                    this.toastService.showToast("Vous n'avez pas scanné le bon emplacement (destination demandée : " + this.livraison.emplacement + ")");
                }
                else {
                    this.validateIsLoading = true;
                    this.sqliteProvider
                        .findArticlesByLivraison(this.livraison.id)
                        .pipe(
                            flatMap((articles) => Observable.zip(
                                ...articles.map((article) => (
                                    this.sqliteProvider
                                        .findMvtByArticleLivraison(article.id)
                                        .pipe(flatMap((mvt) => this.sqliteProvider.finishMvt(mvt.id, this.emplacement.label)))
                                )),
                                flatMap(() => this.sqliteProvider.finishLivraison(this.livraison.id, this.emplacement.label)),
                                flatMap((): any => (
                                    (this.network.type !== 'none')
                                        ? this.localDataManager.saveFinishedProcess('livraison')
                                        : of({offline: true})
                                ))
                            ))
                        )
                        .subscribe(
                            ({offline, success}: any) => {
                                if (offline) {
                                    this.toastService.showToast('Livraison sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                    this.closeScreen();
                                }
                                else {
                                    this.handleLivraisonSuccess(success.length);
                                }
                            },
                            (error) => {
                                this.handleLivraisonError(error);
                            });
                }
            }
            else {
                this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

    private handleLivraisonSuccess(nbLivraisonsSucceed: number): void {
        if (nbLivraisonsSucceed > 0) {
            this.toastService.showToast(
                (nbLivraisonsSucceed === 1
                    ? 'Votre livraison a bien été enregistrée'
                    : `Votre livraison et ${nbLivraisonsSucceed - 1} livraison${nbLivraisonsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handleLivraisonError(resp): void {
        this.validateIsLoading = false;
        this.toastService.showToast((resp && resp.message) ? resp.message : 'Une erreur s\'est produite');
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navCtrl.pop().then(() => {
            this.validateLivraison();
        });
    }
}
