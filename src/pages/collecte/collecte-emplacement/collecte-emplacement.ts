import {Component, ViewChild} from '@angular/core';
import {IonicPage, ModalController, Navbar, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {HttpClient} from '@angular/common/http';
import {Collecte} from '@app/entities/collecte';
import {ToastService} from '@app/services/toast.service';
import {Subscription} from "rxjs";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";


@IonicPage()
@Component({
    selector: 'page-collecte-emplacement',
    templateUrl: 'collecte-emplacement.html',
})
export class CollecteEmplacementPage {
    @ViewChild(Navbar) navBar: Navbar;

    emplacement: Emplacement;
    db_locations: Array<Emplacement>;
    collecte: Collecte;
    apiFinish: string = '/api/finishCollecte';

    public validateCollecte: () => void;

    private isLoading: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqliteProvider: SqliteProvider,
                       public toastService: ToastService,
                       public barcodeScannerManager: BarcodeScannerManagerService,
                       public http: HttpClient,
                       public modal: ModalController) {
        this.isLoading = true;
    }

    public ionViewWillEnter(): void {
        this.collecte = this.navParams.get('collecte');
        this.validateCollecte = this.navParams.get('validateCollecte');

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });

        this.sqliteProvider.findAll('emplacement').subscribe((value) => {
            this.db_locations = value;
            this.isLoading = false;
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
        if (!this.isLoading) {
            const myModal = this.modal.create('CollecteModalSearchEmplacementPage', {
                selectEmplacement: (emplacement) => {
                    this.emplacement = emplacement;
                }
            });
            myModal.present();
        }
    }

    scan() {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    testIfBarcodeEquals(text) {
        const emplacement = this.db_locations.find((dbLocation) => (dbLocation.label === text));
        if (emplacement) {
            this.emplacement = emplacement;
        }
        else {
            this.toastService.showToast('Veuillez scanner ou sélectionner un emplacement connu.');
        }
    }

    validate() {
        if (this.emplacement && this.emplacement.label) {
            if (!this.isLoading) {
                this.isLoading = true;
                let instance = this;
                let promise = new Promise<any>((resolve) => {
                    this.sqliteProvider.findArticlesByCollecte(this.collecte.id).subscribe((articles) => {
                        articles.forEach(function (article) {
                            instance.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                instance.sqliteProvider.findMvtByArticleCollecte(article.id).subscribe((mvt) => {
                                    instance.sqliteProvider.finishMvt(mvt.id, instance.emplacement.label).subscribe(() => {
                                        if (articles.indexOf(article) === articles.length - 1) resolve();
                                    });
                                });
                            });
                        });
                    });
                });
                promise.then(() => {
                    this.sqliteProvider.finishCollecte(this.collecte.id, this.emplacement.label).subscribe(() => {
                        this.sqliteProvider.getAPI_URL().subscribe((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    this.sqliteProvider.findAll('`collecte`').subscribe(collectesToSend => {
                                        this.sqliteProvider.findAll('`mouvement`').subscribe((mvts) => {
                                            let url: string = result + this.apiFinish;
                                            let params = {
                                                collectes: collectesToSend.filter(c => c.date_end !== null),
                                                mouvements: mvts.filter(m => m.id_prepa === null),
                                                apiKey: key
                                            };
                                            this.http.post<any>(url, params).subscribe(
                                                resp => {
                                                    if (resp.success) {
                                                        this.sqliteProvider.deleteCollectes(params.collectes).then(() => {
                                                            this.sqliteProvider.deleteMvts(params.mouvements).then(() => {
                                                                this.isLoading = false;
                                                                this.navCtrl.pop().then(() => {
                                                                    this.validateCollecte();
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
                                                        this.validateCollecte();
                                                    });
                                                }
                                            );
                                        });
                                    });
                                }
                            });
                        })
                    })
                })
            }
            else {
                this.toastService.showToast('Chargement en cours veuillez patienter.');
            }
        }
        else {
            this.toastService.showToast('Veuillez sélectionner ou scanner un emplacement.');
        }
    }

}
