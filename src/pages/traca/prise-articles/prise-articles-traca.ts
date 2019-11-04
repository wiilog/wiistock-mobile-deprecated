import {Component} from '@angular/core';
import {Alert, AlertController, IonicPage, NavController, NavParams} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Article} from '@app/entities/article';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ChangeDetectorRef} from '@angular/core';
import {MouvementTraca} from '@app/entities/mouvement-traca';
import moment from 'moment';
import {Subscription} from 'rxjs';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';
import {ToastService} from '@app/services/toast.service';
import {EntityFactoryService} from '@app/services/entity-factory.service';
import {AlertManagerService} from '@app/services/alert-manager.service';


@IonicPage()
@Component({
    selector: 'page-prise-articles',
    templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

    public emplacement: Emplacement;
    public articles: Array<Article>;
    public db_articles: Array<Article>;

    private zebraScanSubscription: Subscription;
    private finishPrise: () => void;

    private manualEntryAlertWillEnterSubscription: Subscription;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private sqliteProvider: SqliteProvider,
                       private barcodeScannerManager: BarcodeScannerManagerService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private entityFactory: EntityFactoryService,
                       private alertManager: AlertManagerService) {
    }

    public ionViewWillEnter(): void {
        this.sqliteProvider.findAll('article').subscribe((value) => {
            this.db_articles = value;
        });

        this.finishPrise = this.navParams.get('finishPrise');
        this.emplacement = this.navParams.get('emplacement');
        this.articles = this.navParams.get('articles') || [];

        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.testIfBarcodeEquals(barcode);
        });
    }

    public ionViewWillLeave(): void {
        this.removeAlertSubscription();
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public ionViewCanLeave(): boolean {
        return this.barcodeScannerManager.canGoBack;
    }

    public addArticleManually(): void {
        this.createManualEntryAlert().present();
    }

    public finishTaking(): void {
        if (this.articles && this.articles.length > 0) {
            for (let article of this.articles) {
                let numberOfArticles = 0;
                this.articles.forEach((articleToCmp) => {
                    if (articleToCmp.reference === article.reference) {
                        numberOfArticles++;
                    }
                });
                const date = moment().format();
                this.sqliteProvider.getOperateur().then((value) => {
                    const mouvement: MouvementTraca = {
                        id: null,
                        ref_article: article.reference,
                        date: date + '_' + Math.random().toString(36).substr(2, 9),
                        ref_emplacement: this.emplacement.label,
                        type: 'prise',
                        operateur: value
                    };
                    this.sqliteProvider.setPriseValue(article.barcode, numberOfArticles).then(() => {
                        if (this.articles.indexOf(article) === this.articles.length - 1) {
                            this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(
                                () => {
                                    this.redirectAfterTake();
                                },
                                err => console.log(err)
                            );
                        }
                        else {
                            this.sqliteProvider.insert('`mouvement_traca`', mouvement).subscribe(() => {
                            }, (err) => console.log(err));
                        }
                    });
                });
            }
        }
        else {
            this.toastService.showToast('Vous devez sélectionner au moins un article')
        }
    }

    redirectAfterTake() {
        this.navCtrl.pop()
            .then(() => {
                this.finishPrise();
                this.toastService.showToast('Prise enregistrée.')
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

    public testIfBarcodeEquals(barCode: string): void {
        if (this.articles && this.articles.some(article => (article.barcode === barCode))) {
            this.toastService.showToast('Cet article a déjà été ajouté à la prise.');
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
                            cssClass : 'alertAlert'
                        }
                    ]
                })
                .present();
        }
    }

    private createManualEntryAlert(): Alert {
        const manualEntryAlert = this.alertController.create({
            title: 'Saisie manuelle',
            cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
            inputs: [{
                name: 'barCode',
                placeholder: 'Saisir le code barre',
                type: 'text'
            }],
            buttons: [{
                text: 'Valider',
                handler: ({barCode}) => {
                    this.saveArticle(barCode);
                },
                cssClass: 'alertAlert'
            }]
        });

        this.removeAlertSubscription();
        this.manualEntryAlertWillEnterSubscription = manualEntryAlert.willEnter.subscribe(() => {
            this.alertManager.disableAutocapitalizeOnAlert();
        });

        return manualEntryAlert;
    }

    private removeAlertSubscription(): void {
        if (this.manualEntryAlertWillEnterSubscription) {
            this.manualEntryAlertWillEnterSubscription.unsubscribe();
            this.manualEntryAlertWillEnterSubscription = undefined;
        }
    }

    private saveArticle(barCode: string): void {
        const article = this.entityFactory.createArticleBarcode(barCode);
        this.articles.push(article);
        this.changeDetectorRef.detectChanges();
    }
}
