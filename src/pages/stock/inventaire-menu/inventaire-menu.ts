import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, ModalController} from 'ionic-angular';
import {ModalQuantityPage} from '@pages/stock/inventaire-menu/modal-quantity';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticleInventaire} from '@app/entities/article-inventaire';
import {SaisieInventaire} from '@app/entities/saisie-inventaire';
import {InventaireAnomaliePage} from '@pages/stock/inventaire-anomalie/inventaire-anomalie';
import moment from 'moment';
import {filter, flatMap, map} from 'rxjs/operators';
import {Observable, Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {ApiService} from '@app/services/api.service';
import {StorageService} from '@app/services/storage.service';
import {of} from 'rxjs/observable/of';


@IonicPage()
@Component({
    selector: 'page-inventaire-menu',
    templateUrl: 'inventaire-menu.html',
})
export class InventaireMenuPage {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(Content) content: Content;
    articles: Array<ArticleInventaire>;
    articlesByLocation: Array<ArticleInventaire>;
    article: ArticleInventaire;
    locations: Array<string>;
    location: string;
    isInventoryManager: boolean;

    public loading: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(private navCtrl: NavController,
                       private sqliteProvider: SqliteProvider,
                       private apiService: ApiService,
                       private modalController: ModalController,
                       private changeDetector: ChangeDetectorRef,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private toastService: ToastService,
                       private storageService: StorageService) {
    }

    public ionViewWillEnter(): void {
        this.loading = true;
        this.storageService.getInventoryManagerRight().subscribe((isInventoryManager) => {
            this.isInventoryManager = isInventoryManager;
            this.synchronize();
        });

        this.zebraScannerSubscription = this.barcodeScannerManager.zebraScan$
            .pipe(filter(() => (!this.loading && this.articles && this.articles.length > 0)))
            .subscribe((barcode: string) => {
                if (!this.location) {
                    this.checkBarcodeIsLocation(barcode);
                } else {
                    this.checkBarcodeIsRef(barcode);
                }
            });
    }

    public ionViewDidLeave(): void {
        if (this.zebraScannerSubscription) {
            this.zebraScannerSubscription.unsubscribe();
            this.zebraScannerSubscription = undefined;
        }
    }

    addInventoryEntries() : Observable<any> {
        return this.sqliteProvider
            .findAll('`saisie_inventaire`')
            .pipe(
                flatMap((entries) => (
                    entries.length > 0
                        ? this.apiService.requestApi('post', ApiService.ADD_INVENTORY_ENTRIES, {entries})
                        : of({success: false})
                )),
                flatMap((resp) => (
                    resp.success
                        ? this.sqliteProvider.deleteBy('saisie_inventaire').pipe(
                            flatMap(() => this.toastService.presentToast(resp.data.status)),
                            map(() => undefined)
                        )
                        : of(undefined)
                ))
            );
    }

    public synchronize(): void {
        this.loading = true;
        this.addInventoryEntries()
            .pipe(flatMap(() => this.sqliteProvider.findAll('`article_inventaire`')))
            .subscribe((articles) => {
                this.articles = articles;
                this.locations = this.articles
                    .reduce((acc, {location}) => ([
                        ...acc,
                        ...(acc.indexOf(location) === -1 ? [location] : [])
                    ]), []);
                this.loading = false;
                this.content.resize();
            });
    }


    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage);
        modal.onDidDismiss((data) => {
            if (data && data.quantity) {
                //crée saisie inventaire et envoie vers api
                let saisieInventaire: SaisieInventaire = {
                    id: null,
                    id_mission: article.id_mission,
                    date: moment().format(),
                    reference: article.reference,
                    is_ref: article.is_ref,
                    quantity: data.quantity,
                    location: article.location,
                };
                Observable.zip(
                    this.sqliteProvider.insert('`saisie_inventaire`', saisieInventaire),
                    this.sqliteProvider.deleteBy('`article_inventaire`', article.id)
                ).subscribe(() => {
                    // supprime la ligne des tableaux
                    let index1 = this.articles.indexOf(article);
                    if (index1 > -1) this.articles.splice(index1, 1);
                    let index2 = this.articlesByLocation.indexOf(article);
                    if (index2 > -1) this.articlesByLocation.splice(index2, 1);
                    this.addInventoryEntries().subscribe(() => {
                        // si liste vide retour aux emplacements
                        if (this.articlesByLocation.length === 0) {
                            this.backToLocations();
                        }
                    });
                });
            }
        });
        modal.present();
    }

    async goToAnomalies() {
        this.navCtrl.push(InventaireAnomaliePage);
    }

    scanLocation() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsLocation(res);
        });
    }


    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public checkBarcodeIsLocation(barcode: string): void {
        if (this.articles.some(article => (article.location === barcode))) {
            this.location = barcode;
            this.articlesByLocation = this.articles.filter(article => (article.location === this.location));
            this.changeDetector.detectChanges();
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }

    scanRef() {
        this.barcodeScannerManager.scan().subscribe(res => {
            this.checkBarcodeIsRef(res);
        });
    }

    checkBarcodeIsRef(barcode: string) {
        if (this.articlesByLocation.some((article) => (article.barcode === barcode))) {
            this.article = this.articlesByLocation.find(article => (article.barcode === barcode));
            this.changeDetector.detectChanges();
            this.openModalQuantity(this.article);
        } else {
            this.toastService.presentToast('Ce code-barre ne correspond à aucune référence ou article sur cet emplacement.');
        }
    }

    backToLocations() {
        this.location = null;
        let locations = [];
        this.articles.forEach(anomaly => {
            if (locations.indexOf(anomaly.location) < 0 && anomaly.location) {
                locations.push(anomaly.location);
            }
        });
        this.locations = locations;
    }
}
