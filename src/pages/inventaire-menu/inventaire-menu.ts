import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {Content, IonicPage, Navbar, NavController, NavParams, ToastController, ModalController} from 'ionic-angular';
import {ModalQuantityPage} from "./modal-quantity";
import {MenuPage} from "../menu/menu";
import {SqliteProvider} from "../../providers/sqlite/sqlite";
import {HttpClient} from "@angular/common/http";
import {ArticleInventaire} from "../../app/entities/articleInventaire";
import {SaisieInventaire} from "../../app/entities/saisieInventaire";
import {InventaireAnomaliePage} from "../inventaire-anomalie/inventaire-anomalie";
import moment from "moment";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";
import {flatMap, filter} from "rxjs/operators";
import {of} from "rxjs/observable/of";
import {Subscription} from "rxjs";
import {ZebraBarcodeScannerService} from "../../app/services/zebra-barcode-scanner.service";


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
    dataApi: string = '/api/getData';
    addEntryURL : string = '/api/addInventoryEntries';
    isInventoryManager: boolean;
    isLoaded: boolean;

    private zebraScannerSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public sqlLiteProvider: SqliteProvider,
                       public http: HttpClient,
                       public toastController: ToastController,
                       private barcodeScanner: BarcodeScanner,
                       private modalController: ModalController,
                       private changeDetector: ChangeDetectorRef,
                       private zebraBarcodeScannerService: ZebraBarcodeScannerService) {
        this.sqlLiteProvider.getInventoryManagerRight().then(isInventoryManager => {
            this.isInventoryManager = isInventoryManager;
        });
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    public ionViewDidEnter(): void {
        this.synchronize();
        this.setBackButtonAction();

        this.zebraScannerSubscription = this.zebraBarcodeScannerService.zebraScan$
            .pipe(filter(() => (this.isLoaded && this.articles && this.articles.length > 0)))
            .subscribe((barcode: string) => {
                if (!this.location) {
                    this.checkBarcodeIsLocation(barcode);
                }
                else {
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

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {
            this.navCtrl.setRoot(MenuPage);
        }
    }

    addInventoryEntries() {
        this.sqlLiteProvider.getAPI_URL().subscribe(baseUrl => {
           if (baseUrl !== null) {
               let url: string = baseUrl + this.addEntryURL;
               this.sqlLiteProvider.findAll('`saisie_inventaire`').subscribe(data => {
                   if (data.length > 0) {
                       this.sqlLiteProvider.getApiKey().then(apiKey => {
                           let params = {
                               entries: data,
                               apiKey: apiKey
                           };
                           this.http.post<any>(url, params).subscribe(resp => {
                               if (resp.success) {
                                   this.sqlLiteProvider.cleanTable('`saisie_inventaire`');
                                   this.showToast(resp.data.status);
                               }
                           });
                       });
                   }
               })
           } else {
               this.showToast('Veuillez configurer votre URL dans les paramètres.')
           }
        });
    }

    synchronize() {
        this.hasLoaded = false;
        this.sqlLiteProvider.getAPI_URL().subscribe(
            (result) => {
                if (result !== null) {
                    let url: string = result + this.dataApi;
                    this.sqlLiteProvider.getApiKey().then((key) => {
                        this.http.post<any>(url, {apiKey: key}).subscribe(resp => {
                            if (resp.success) {
                                this.sqlLiteProvider.cleanTable('`article_inventaire`')
                                    .pipe(
                                        flatMap(() => this.sqlLiteProvider.importArticlesInventaire(resp.data)),
                                        flatMap((sqlArticlesInventaire) => {
                                            return (sqlArticlesInventaire !== false)
                                                ? this.sqlLiteProvider.executeQuery(sqlArticlesInventaire)
                                                : of(undefined)
                                        })
                                    )
                                    .subscribe((plop) => {
                                        this.sqlLiteProvider.findAll('`article_inventaire`').subscribe(articles => {
                                            this.articles = articles;
                                            let locations = [];
                                            articles.forEach(article => {
                                               if (locations.indexOf(article.location) < 0 && article.location) {
                                                   locations.push(article.location);
                                               }
                                            });
                                            this.locations = locations;

                                            setTimeout(() => {
                                                this.isLoaded = true;
                                                this.content.resize();
                                            }, 1000);
                                        });
                                        this.addInventoryEntries();
                                    },

                                        (err) => {
                                        console.log('ERRR PLOP => ', err)
                                        });
                            } else {
                                this.isLoaded = true;
                                this.showToast('Une erreur est survenue.');
                            }
                        }, error => {
                            this.isLoaded = true;
                            this.showToast('Une erreur réseau est survenue.');
                        });
                    });
                } else {
                    this.showToast('Veuillez configurer votre URL dans les paramètres.')
                }
            },
            err => console.log(err)
        );
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

    async openModalQuantity(article) {
        let modal = this.modalController.create(ModalQuantityPage, {article: article});
        modal.onDidDismiss(data => {
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
            this.sqlLiteProvider.insert('`saisie_inventaire`', saisieInventaire).subscribe(() => {
                // supprime l'article de la base
                this.sqlLiteProvider.deleteById('`article_livraison`', article.id);
                // supprime la ligne des tableaux
                let index1 = this.articles.indexOf(article);
                if (index1 > -1) this.articles.splice(index1, 1);
                let index2 = this.articlesByLocation.indexOf(article);
                if (index2 > -1) this.articlesByLocation.splice(index2, 1);
                this.addInventoryEntries();
                // si liste vide retour aux emplacements
                if (this.articlesByLocation.length === 0) {
                    this.backToLocations();
                }
            });
        });
        modal.present();
    }

    async goToAnomalies() {
        this.navCtrl.push(InventaireAnomaliePage);
    }

    scanLocation() {
        this.barcodeScanner.scan().then(res => {
            this.checkBarcodeIsLocation(res.text);
        });
    }

    public checkBarcodeIsLocation(barcode: string): void {
        if (this.articles.some(article => (article.location === barcode))) {
            this.location = barcode;
            this.articlesByLocation = this.articles.filter(article => (article.location === this.location));
            this.changeDetector.detectChanges();
        } else {
            this.showToast('Ce code-barre ne correspond à aucun emplacement.');
        }
    }

    scanRef() {
        this.barcodeScanner.scan().then(res => {
            this.checkBarcodeIsRef(res.text);
        });
    }

    checkBarcodeIsRef(barcode: string) {
        if (this.articlesByLocation.some(article => (article.reference === barcode))) {
            this.article = this.articlesByLocation.find(article => (article.reference === barcode));
            this.changeDetector.detectChanges();
            this.openModalQuantity(this.article);
        } else {
            this.showToast('Ce code-barre ne correspond à aucune référence ou article sur cet emplacement.');
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

    ionViewDidLoad() {
        console.log('ionViewDidLoad InventaireMenuPage');
    }

}

