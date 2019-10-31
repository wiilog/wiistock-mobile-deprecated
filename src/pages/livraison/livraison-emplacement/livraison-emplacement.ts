import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from "../../menu/menu";
import {Emplacement} from "../../../app/entities/emplacement";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {LivraisonMenuPage} from "../livraison-menu/livraison-menu";
import {HttpClient} from "@angular/common/http";
import {LivraisonArticlesPage} from "../livraison-articles/livraison-articles";
import {Livraison} from "../../../app/entities/livraison";
import {ToastService} from "@app/services/toast.service";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {Subscription} from "rxjs";

/**
 * Generated class for the LivraisonEmplacementPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-emplacement',
    templateUrl: 'livraison-emplacement.html',
})
export class LivraisonEmplacementPage {
    @ViewChild(Navbar) navBar: Navbar;

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    livraison: Livraison;
    apiFinish: string = '/api/finishLivraison';

    private validateIsLoading: boolean;
    private validateLivraison: () => void;
    private zebraScannerSubscription: Subscription;

    constructor(public navCtrl: NavController,
                public navParams: NavParams,
                public sqliteProvider: SqliteProvider,
                public toastService: ToastService,
                public barcodeScannerManager: BarcodeScannerManagerService,

                public http: HttpClient,
                public modal: ModalController) {
        this.validateIsLoading = false;
    }

    public ionViewWillEnter(): void {
        this.validateLivraison = this.navParams.get('validateLivraison');
        this.livraison = this.navParams.get('livraison');

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode) => {
            this.testLocation(barcode);
        });
        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
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

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    searchEmplacementModal() {
        if (!this.validateIsLoading) {
            const myModal = this.modal.create('LivraisonModalSearchEmplacementPage', {
                livraison: this.livraison,
                selectLocation(location) {
                    this.testLocation(location, false);
                }
            });
            myModal.present();
        }
    }

    scan() {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testLocation(barcode);
        });
    }

    testLocation(locationToTest, fromBarcode: boolean = true) {
        const location = fromBarcode
            ? this.db_locations.find(({label}) => (label === locationToTest))
            : locationToTest;
        const locationLabel = fromBarcode
            ? locationToTest
            : location.text;
        if (location) {
            if (this.livraison.emplacement === locationLabel) {
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

    validate() {
        if (!this.validateIsLoading) {
            if (this.emplacement && this.emplacement.label !== '') {
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
                        this.sqliteProvider.getAPI_URL().subscribe((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    this.sqliteProvider.findAll('`livraison`').subscribe(livraisonsToSend => {
                                        this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                            let url: string = result + this.apiFinish;
                                            let params = {
                                                livraisons: livraisonsToSend.filter(p => p.date_end !== null),
                                                mouvements: mvts.filter(m => m.id_prepa === null),
                                                apiKey: key
                                            };
                                            this.http.post<any>(url, params).subscribe(resp => {
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
                                }
                                else {
                                    this.validateIsLoading = false;
                                }
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
