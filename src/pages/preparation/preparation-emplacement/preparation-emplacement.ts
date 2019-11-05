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
import {ApiServices} from "@app/config/api-services";


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
                       private toastService: ToastService) {
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
                    this.sqliteProvider.finishPrepaStorage().then(() => {
                        this.sqliteProvider.finishPrepa(this.preparation.id, this.emplacement.label).subscribe(() => {
                            this.sqliteProvider.getApiUrl(ApiServices.FINISH_PREPA).subscribe((finishPrepaUrl) => {
                                this.sqliteProvider.getApiKey().then((key) => {
                                    this.sqliteProvider.findAll('`preparation`').subscribe(preparationsToSend => {
                                        this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                            let params = {
                                                preparations: preparationsToSend.filter(p => p.date_end !== null),
                                                mouvements: mvts.filter(m => m.id_livraison === null),
                                                apiKey: key
                                            };
                                            this.http.post<any>(finishPrepaUrl, params).subscribe(resp => {
                                                    if (resp.success) {
                                                        this.sqliteProvider.deletePreparations(params.preparations).then(() => {
                                                            this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                                this.isLoading = false;
                                                                this.navCtrl.pop().then(() => {
                                                                    this.validatePrepa();
                                                                });
                                                            });
                                                        });
                                                    }
                                                    else {
                                                        this.isLoading = false;
                                                        this.toastService.showToast(resp.msg);
                                                    }
                                                },
                                                () => {
                                                    this.isLoading = false;
                                                    this.navCtrl.pop().then(() => {
                                                        this.validatePrepa();
                                                    });
                                                }
                                            );
                                        });
                                    });
                                });
                            });
                        })
                    })
                })
            }
            else {
                this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }
}
