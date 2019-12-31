import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Collecte} from '@app/entities/collecte';
import {ToastService} from '@app/services/toast.service';
import {Observable, Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {flatMap} from 'rxjs/operators';
import {of} from 'rxjs/observable/of';
import {Network} from '@ionic-native/network';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';


@IonicPage()
@Component({
    selector: 'page-collecte-emplacement',
    templateUrl: 'collecte-emplacement.html',
})
export class CollecteEmplacementPage {
    @ViewChild(Navbar)
    public navBar: Navbar;

    @ViewChild('searchComponent')
    public searchComponent: SearchLocationComponent;

    public emplacement: Emplacement;
    public collecte: Collecte;

    public validateCollecte: () => void;

    private isLoading: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService) {
        this.isLoading = true;
    }

    public ionViewWillEnter(): void {
        this.collecte = this.navParams.get('collecte');
        this.validateCollecte = this.navParams.get('validateCollecte');
        this.isLoading = false;

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
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

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public testIfBarcodeEquals(text: string): void {
        const emplacement = this.searchComponent.isKnownLocation(text);
        if (emplacement) {
            this.emplacement = emplacement;
        }
        else {
            this.toastService.presentToast('Veuillez scanner ou sélectionner un emplacement connu.');
        }
    }

    public validate(): void {
        if (this.emplacement && this.emplacement.label) {
            if (!this.isLoading) {
                this.isLoading = true;

                this.sqliteProvider
                    .findArticlesByCollecte(this.collecte.id)
                    .pipe(
                        flatMap((articles) => Observable.zip(
                            ...articles.map((article) => (
                                this.sqliteProvider
                                    .findMvtByArticleCollecte(article.id)
                                    .pipe(flatMap((mvt) => (
                                        mvt
                                            ? this.sqliteProvider.finishMvt(mvt.id, this.emplacement.label)
                                            : of(undefined)
                                    )))
                            ))
                        )),
                        flatMap(() => this.sqliteProvider.finishCollecte(this.collecte.id, this.emplacement.label)),
                        flatMap((): any => (
                            this.network.type !== 'none'
                                ? this.localDataManager.sendFinishedProcess('collecte')
                                : of({offline: true})
                        ))
                    )
                    .subscribe(
                        ({offline, success}: any) => {
                            if (offline) {
                                this.toastService.presentToast('Collecte sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                this.closeScreen();
                            }
                            else {
                                this.handleCollectesSuccess(success);
                            }
                        },
                        (error) => {
                            this.handlePreparationError(error);
                        });
            }
            else {
                this.toastService.presentToast('Chargement en cours veuillez patienter.');
            }
        }
        else {
            this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
        }
    }

    private handleCollectesSuccess(success: Array<{newCollecte, articlesCollecte}>): void {
        if (success.length > 0) {
            Observable.zip(
                ...success
                    .filter(({newCollecte}) => newCollecte)
                    .map(({newCollecte, articlesCollecte}) => (
                        Observable.zip(
                            this.sqliteProvider.executeQuery(
                                this.sqliteProvider.getCollecteInsertQuery([this.sqliteProvider.getCollecteValueFromApi(newCollecte)])
                            ),
                            ...(articlesCollecte.map((newArticleCollecte) => (
                                this.sqliteProvider.executeQuery(
                                    this.sqliteProvider.getArticleCollecteInsertQuery([this.sqliteProvider.getArticleCollecteValueFromApi(newArticleCollecte)])
                                )
                            )))
                        )
                    )),
                this.toastService.presentToast(
                    (success.length === 1
                        ? 'Votre collecte a bien été enregistrée'
                        : `Votre collecte et ${success.length - 1} collecte${success.length - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
                )
            ).subscribe(() => {
                this.closeScreen();
            })
        }
        else {
            this.closeScreen();
        }
    }

    private handlePreparationError(resp): void {
        this.isLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
    }

    private closeScreen(): void {
        this.isLoading = false;
        this.navCtrl.pop().then(() => {
            this.validateCollecte();
        });
    }
}