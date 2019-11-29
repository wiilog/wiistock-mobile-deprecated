import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ChangeDetectorRef} from '@angular/core';
import {ToastService} from '@app/services/toast.service';
import {EntityFactoryService} from '@app/services/entity-factory.service';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';
import {Subscription} from "rxjs";
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";


@IonicPage()
@Component({
    selector: 'page-depose-articles',
    templateUrl: 'depose-articles-traca.html',
})
export class DeposeArticlesPageTraca {

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;
    private zebraScanSubscription: Subscription;
    public emplacement: Emplacement;
    public articles: Array<Article>;
    public db_articles: Array<Article>;

    private finishDepose: () => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private changeDetectorRef: ChangeDetectorRef,
                       private entityFactory: EntityFactoryService,
                       private localDataManager: LocalDataManagerService,
                       private storageService: StorageService,
                       private barcodeScannerManager: BarcodeScannerManagerService) {

    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });

        this.emplacement = this.navParams.get('emplacement');
        this.finishDepose = this.navParams.get('finishDepose');
        this.articles = this.navParams.get('articles') || [];
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testSelectedArticle(barcode);
        });
    }

    public ionViewWillLeave(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return !this.footerScannerComponent.isScanning;
    }

    public finishTaking(): void {
        if (this.articles && this.articles.length > 0) {
            this.localDataManager
                .saveMouvementsTraca(this.articles, this.emplacement, 'depose')
                .subscribe(() => {
                    this.redirectAfterTake();
                });
        }
        else {
            this.toastService.presentToast('Vous devez sélectionner au moins un article')
        }
    }

    public redirectAfterTake(): void {
        this.navCtrl
            .pop()
            .then(() => {
                this.finishDepose();
                this.toastService.presentToast('Dépose enregistrée.')
            });
    }

    public goHome(): void {
        this.navCtrl.setRoot(MenuPage);
    }

    public testSelectedArticle(barCode: string, isManualInput: boolean = false): void {
        let numberOfArticles = this.articles
            .filter(article => (article.reference === barCode))
            .length;

        this.storageService.keyExists(barCode).subscribe((value) => {
            if (value !== false) {
                if (value > numberOfArticles) {
                    if (isManualInput) {
                        this.saveArticle(barCode);
                    }
                    else {
                        this.alertController
                            .create({
                                title: `Vous avez sélectionné l'article ${barCode}`,
                                buttons: [
                                    {
                                        text: 'Annuler'
                                    },
                                    {
                                        text: 'Confirmer',
                                        handler: () => {
                                            this.saveArticle(barCode);
                                        },
                                        cssClass: 'alertAlert'
                                    }
                                ]
                            })
                            .present();
                    }
                }
                else {
                    this.toastService.presentToast('Cet article est déjà enregistré assez de fois dans le panier.');
                }
            }
            else {
                this.toastService.presentToast('Ce colis ne correspond à aucune prise.');
            }
        });
    }

    private saveArticle(barcode: string): void {
        const article = this.entityFactory.createArticleBarcode(barcode);
        this.articles.push(article);
        this.changeDetectorRef.detectChanges();
    }
}
