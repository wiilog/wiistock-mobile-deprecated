import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {Content, IonicPage, ModalController, Navbar} from 'ionic-angular';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Anomalie} from '@app/entities/anomalie';
import {ModalQuantityPage} from '@pages/stock/inventaire-menu/modal-quantity';
import {Article} from '@app/entities/article';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';


@IonicPage()
@Component({
    selector: 'page-inventaire-anomalie',
    templateUrl: 'inventaire-anomalie.html',
})
export class InventaireAnomaliePage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    anomalies: Array<Anomalie>;
    anomaliesByLocation: Array<Anomalie>;
    anomaly: Anomalie;
    article: Article;
    locations: Array<string>;
    location: string;

    public loading: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(private sqliteProvider: SqliteProvider,
                       private changeDetector: ChangeDetectorRef,
                       private modalController: ModalController,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService,
                       private apiService: ApiService) {}


    public ionViewWillEnter(): void {
        this.synchronize();
        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$
            .pipe(filter(() => (!this.loading && this.anomalies && this.anomalies.length > 0)))
            .subscribe((barcode: string) => {
                if (this.location) {
                    this.checkBarcodeIsRef(barcode);
                }
                else {
                    this.checkBarcodeIsLocation(barcode);
                }
            });
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public ionViewWillLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    synchronize() {
        this.loading = true;

        this.sqliteProvider.findAll('`anomalie_inventaire`').subscribe(anomalies => {
            this.anomalies = anomalies;
            let locations = anomalies
                .reduce((acc, {location}) => ([
                    ...acc,
                    ...(acc.indexOf(location) === -1 ? [location] : [])
                ]), []);

            // envoi des anomalies traitées
            this.sqliteProvider.findByElement(`anomalie_inventaire`, 'treated', '1').subscribe((anomalies) => {
                this.apiService.requestApi('post', ApiService.TREAT_ANOMALIES, {params: {anomalies}}).subscribe((resp) => {
                    this.locations = locations;
                    if (resp.success) {
                        // supprime les anomalies traitée de la base
                        this.sqliteProvider
                            .deleteBy('anomalie_inventaire', anomalies.map(({id}) => id))
                            .subscribe(() => {
                                this.loading = false;
                                this.toastService.presentToast(resp.data.status);
                                this.content.resize();
                            });
                    } else {
                        this.loading = false;
                        this.toastService.presentToast('Une erreur est survenue lors de la mise à jour des anomalies.');
                        this.content.resize();
                    }
                });
            });
        });
    }

    scanLocation() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsLocation(res);
        });
    }

    scanRef() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsRef(res);
        });
    }

    public checkBarcodeIsLocation(barcode: string): void {
        if (this.anomalies.some(anomaly => (anomaly.location === barcode))) {
            this.location = barcode;
            this.anomaliesByLocation = this.anomalies.filter(anomaly => (anomaly.location === this.location));
            this.changeDetector.detectChanges();
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }

    //TODO CG plutôt sur anomaliesByLocation ??
    public checkBarcodeIsRef(barcode: string): void {
        if (this.anomalies.some(anomaly => (anomaly.barcode === barcode))) {
            this.article = {reference: barcode};
            this.anomaly = this.anomaliesByLocation.find(anomaly => (anomaly.barcode === barcode));
            this.changeDetector.detectChanges();
            this.openModalQuantity(this.article);
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucune référence ou article.');
        }
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
            if (data && data.quantity) {
                this.anomaly.quantity = data.quantity;
                this.anomaly.treated = "1";

                // envoi de l'anomalie modifiée à l'API
                this.apiService.requestApi('post', ApiService.TREAT_ANOMALIES, {params: {anomalies: [this.anomaly]}}).subscribe((resp) => {
                    if (resp.success) {
                        // supprime l'anomalie traitée de la base
                        this.sqliteProvider.deleteBy(`anomalie_inventaire`, this.anomaly.id).subscribe(() => {
                            this.toastService.presentToast(resp.data.status).subscribe(() => {
                                // supprime l'anomalie de la liste
                                this.anomaliesByLocation = this.anomaliesByLocation.filter(anomaly => parseInt(anomaly.treated) !== 1);
                                // si liste vide retour aux emplacements
                                if (this.anomaliesByLocation.length === 0) {
                                    this.backToLocations();
                                }
                            });
                        });
                    }
                });
            }
        });
        modal.present();
    }

    backToLocations() {
        this.anomalies = this.anomalies.filter(anomaly => parseInt(anomaly.treated) !== 1);
        this.location = null;
        let locations = [];
        this.anomalies.forEach(anomaly => {
            if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                locations.push(anomaly.location);
            }
        });
        this.locations = locations;
    }

}
