import {Component, ViewChild} from '@angular/core';
import {AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ChangeDetectorRef} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {EntityFactoryService} from '@app/services/entity-factory.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {ListHeaderConfig} from '@helpers/components/list/model/list-header-config';
import {ListElementConfig} from '@helpers/components/list/model/list-element-config';
import {BarcodeScannerComponent} from '@helpers/components/barcode-scanner/barcode-scanner.component';


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

    @ViewChild('footerScannerComponent')
    public footerScannerComponent: BarcodeScannerComponent;

    public emplacement: Emplacement;
    public articles: Array<Article>;
    public db_articles: Array<Article>;

    private finishPrise: () => void;

    public listHeader: ListHeaderConfig;
    public listBody: Array<ListElementConfig>;
    public listBoldValues: Array<string>;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private entityFactory: EntityFactoryService,
                       private localDataManager: LocalDataManagerService) {
        this.listBody = [];
        this.listBoldValues = [
            'object'
        ];
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });

        this.finishPrise = this.navParams.get('finishPrise');
        this.emplacement = this.navParams.get('emplacement');
        this.articles = this.navParams.get('articles') || [];

        this.refreshListComponent();
    }

    private refreshListComponent(): void {
        const pickedArticlesNumber = this.articles.length;
        const plural = pickedArticlesNumber > 1 ? 's' : '';;
        this.listHeader = {
            title: 'PRISE',
            subtitle: `Emplacement : ${this.emplacement.label}`,
            info: `${pickedArticlesNumber} produit${plural} scanné${plural}`,
            leftIcon: {
                name: 'upload.svg',
                color: 'primary'
            }
        };
    }

    public ionViewCanLeave(): boolean {
        return !this.footerScannerComponent.isScanning;
    }

    public finishTaking(): void {
        if (this.articles && this.articles.length > 0) {
            this.localDataManager
                .saveMouvementsTraca(this.articles, this.emplacement, 'prise')
                .subscribe(() => {
                    this.redirectAfterTake();
                });
        }
        else {
            this.toastService.presentToast('Vous devez sélectionner au moins un article')
        }
    }

    redirectAfterTake() {
        this.navCtrl.pop()
            .then(() => {
                this.finishPrise();
                this.toastService.presentToast('Prise enregistrée.')
            });
    }

    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public testIfBarcodeEquals(barCode: string, isManualAdd: boolean = false): void {
        if (this.articles && this.articles.some(article => (article.barcode === barCode))) {
            this.toastService.presentToast('Cet article a déjà été ajouté à la prise.');
        }
        else {
            if (isManualAdd) {
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
    }

    private saveArticle(barCode: string): void {
        const article = this.entityFactory.createArticleBarcode(barCode);
        this.articles.push(article);
        this.listBody.push({
            infos: {
                object: {
                    label: 'Objet',
                    value: article.barcode
                },
                date: {
                    label: 'Date / Heure',
                    value: article.date
                }
            }
        });
        this.refreshListComponent();
        this.changeDetectorRef.detectChanges();
    }
}
