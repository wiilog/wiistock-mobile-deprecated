import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {Livraison} from '@app/entities/livraison';
import {ToastService} from '@app/services/toast.service';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {Subscription} from 'rxjs';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {ApiServices} from "@app/config/api-services";


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

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public toastService: ToastService,
                       public barcodeScannerManager: BarcodeScannerManagerService,
                       public http: HttpClient) {
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
                    let instance = this;
                    let promise = new Promise<any>((resolve) => {
                        this.sqliteProvider.findArticlesByLivraison(this.livraison.id).subscribe((articles) => {
                            articles.forEach(function (article) {
                                instance.sqliteProvider.findMvtByArticleLivraison(article.id).subscribe((mvt) => {
                                    instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).subscribe(() => {
                                        if (articles.indexOf(article) === articles.length - 1) resolve();
                                    });
                                });
                            });
                        });
                    });
                    promise.then(() => {
                        this.sqliteProvider.finishLivraison(this.livraison.id, this.emplacement.label).subscribe(() => {
                            this.sqliteProvider.getApiUrl(ApiServices.FINISH_LIVRAISON).subscribe((finishLivraisonUrl) => {
                                this.sqliteProvider.getApiKey().then((key) => {
                                    this.sqliteProvider.findAll('`livraison`').subscribe(livraisonsToSend => {
                                        this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                            let params = {
                                                livraisons: livraisonsToSend.filter(p => p.date_end !== null),
                                                mouvements: mvts.filter(m => m.id_prepa === null),
                                                apiKey: key
                                            };
                                            this.http.post<any>(finishLivraisonUrl, params).subscribe(resp => {
                                                    if (resp.success) {
                                                        this.sqliteProvider.deleteLivraisons(params.livraisons).then(() => {
                                                            this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                                this.navCtrl.pop().then(() => {
                                                                    this.validateLivraison();
                                                                })
                                                            });
                                                        });
                                                    }
                                                    else {
                                                        this.toastService.showToast(resp.msg);
                                                    }
                                                    this.validateIsLoading = false;
                                                },
                                                () => {
                                                    this.validateIsLoading = false;
                                                    this.navCtrl.pop().then(() => {
                                                        this.validateLivraison();
                                                    })
                                                }
                                            );
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            }
            else {
                this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }
}
