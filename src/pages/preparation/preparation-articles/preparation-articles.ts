import {Component, ViewChild} from '@angular/core';
import {IonicPage, Navbar, NavController, NavParams, ToastController} from 'ionic-angular';
import {MenuPage} from '@pages/menu/menu';
import {Preparation} from '@app/entities/preparation';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {PreparationMenuPage} from '@pages/preparation/preparation-menu/preparation-menu';
import {Mouvement} from '@app/entities/mouvement';
import {PreparationArticleTakePage} from '@pages/preparation/preparation-article-take/preparation-article-take';
import {HttpClient} from '@angular/common/http';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import {PreparationEmplacementPage} from '@pages/preparation/preparation-emplacement/preparation-emplacement';
import moment from 'moment';
import {PreparationRefArticlesPage} from "@pages/preparation/preparation-ref-articles/preparation-ref-articles";
import {Observable} from "rxjs";
import {flatMap, map} from "rxjs/operators";
import {ArticlePrepaByRefArticle} from "@app/entities/article-prepa-by-ref-article";
import {of} from "rxjs/observable/of";


/**
 * Generated class for the PreparationArticlesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-articles',
    templateUrl: 'preparation-articles.html',
})
export class PreparationArticlesPage {

    @ViewChild(Navbar) navBar: Navbar;
    preparation: Preparation;
    articlesNT: Array<ArticlePrepa>;
    articlesT: Array<ArticlePrepa>;
    started: boolean = false;
    apiStartPrepa = '/api/beginPrepa';
    isValid: boolean = true;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController,
        public sqliteProvider: SqliteProvider,
        public http: HttpClient,
        public barcodeScanner: BarcodeScanner) {
        if (typeof (navParams.get('preparation')) !== undefined) {
            this.preparation = navParams.get('preparation');
            this.sqliteProvider.findArticlesByPrepa(this.preparation.id).subscribe((articles) => {
                this.articlesNT = articles.filter(article => article.has_moved === 0);
                this.articlesT = articles.filter(article => article.has_moved === 1);
                if (this.articlesT.length > 0) {
                    this.started = true;
                }
                if (navParams.get('article') !== undefined && navParams.get('quantite') !== undefined) {
                    this.isValid = this.navParams.get('valid');
                    this.started = this.navParams.get('started');
                    if (!this.started) {
                        this.sqliteProvider.getAPI_URL().subscribe((result) => {
                            this.sqliteProvider.getApiKey().then((key) => {
                                if (result !== null) {
                                    let url: string = result + this.apiStartPrepa;
                                    this.http.post<any>(url, {id: this.preparation.id, apiKey: key}).subscribe(resp => {
                                        if (resp.success) {
                                            this.started = true;
                                            this.isValid = true;
                                            this.sqliteProvider.startPrepa(this.preparation.id).subscribe(() => {
                                                this.showToast('Préparation commencée.');
                                                this.selectArticle();
                                            });
                                        } else {
                                            this.isValid = false;
                                            this.showToast(resp.msg);
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        this.selectArticle();
                    }
                }
            })
        }

        let instance = this;
        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: [
                    'io.ionic.starter.ACTION'
                ],
                filterCategories: [
                    'android.intent.category.DEFAULT'
                ]
            },
            function (intent) {
                instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string']);
            });
    }

    scan() {
        this.barcodeScanner.scan().then(res => {
            this.testIfBarcodeEquals(res.text);
        });
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

    ionViewDidEnter() {
        this.setBackButtonAction();
    }

    refreshOver() {
        this.showToast('Préparation prête à être finalisée.')
    }

    refresh() {
        this.showToast('Quantité bien prélevée.')
    }

    setBackButtonAction() {
        this.navBar.backButtonClick = () => {

            //Write here wherever you wanna do
            this.navCtrl.setRoot(PreparationMenuPage);
        }
    }

    public selectArticle(selectedArticle: ArticlePrepa|ArticlePrepaByRefArticle, selectedQuantity: number): void {
        // const selectedArticle = this.navParams.get('article');
        // const selectedQuantity = Number(this.navParams.get('quantite'));

        // if preparation is valid
        if (this.isValid) {

            // check if article is managed by 'article'
            const isSelectableByUser = ((selectedArticle as ArticlePrepaByRefArticle).isSelectableByUser);
            const availableQuantity = isSelectableByUser
                ? (selectedArticle as ArticlePrepaByRefArticle).quantity
                : (selectedArticle as ArticlePrepa).quantite;

            // if the quantity selected is smaller than the number of article
            if (availableQuantity !== selectedQuantity) {
                let newArticle: ArticlePrepa = {
                    id: null,
                    label: (selectedArticle as ArticlePrepa).label,
                    reference: selectedArticle.reference,
                    quantite: selectedQuantity,
                    is_ref: (selectedArticle as ArticlePrepa).is_ref,
                    id_prepa: (selectedArticle as ArticlePrepa).id_prepa,
                    has_moved: 1,
                    emplacement: (selectedArticle as ArticlePrepa).emplacement
                };

                // check if we alreay have selected the article
                let articleAlready = this.articlesT.find(art => (
                    (art.id_prepa === newArticle.id_prepa) &&
                    (art.is_ref === newArticle.is_ref) &&
                    (art.reference === newArticle.reference)
                ));
                if (articleAlready !== undefined) {
                    // we update the quantity in the list of treated article
                    this.sqliteProvider.updateArticlePrepaQuantity(articleAlready.id, newArticle.quantite + articleAlready.quantite)
                        .pipe(
                            // we update quantity in the list of untreated articles
                            flatMap(() => this.sqliteProvider.updateArticlePrepaQuantity((selectedArticle as ArticlePrepa).id, (selectedArticle as ArticlePrepa).quantite - newArticle.quantite)),
                        )
                        .subscribe(() => {
                            this.updateLists();
                        });
                }
                else {
                    if (isSelectableByUser) {
                        this.selectAnArticle(selectedArticle, selectedQuantity)
                    }
                    else {
                        this.sqliteProvider.insert('`article_prepa`', newArticle).subscribe((insertId) => {
                            let mouvement: Mouvement = {
                                id: null,
                                reference: newArticle.reference,
                                quantity: (selectedArticle as ArticlePrepa).quantite,
                                date_pickup: moment().format(),
                                location_from: newArticle.emplacement,
                                date_drop: null,
                                location: null,
                                type: 'prise-dépose',
                                is_ref: newArticle.is_ref,
                                id_article_prepa: insertId,
                                id_prepa: newArticle.id_prepa,
                                id_article_livraison: null,
                                id_livraison: null
                            };
                            // we update value quantity of selected article
                            this.sqliteProvider.updateArticlePrepaQuantity((selectedArticle as ArticlePrepa).id, (selectedArticle as ArticlePrepa).quantite - selectedQuantity)
                                .pipe(flatMap(() => this.sqliteProvider.insert('`mouvement`', mouvement)))
                                .subscribe(() => {
                                    this.updateLists();
                                })
                        });
                    }
                }
            }
            // if we select all the article
            else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: selectedArticle.reference,
                    selected_by_article: isSelectableByUser,
                    quantity: isSelectableByUser
                        ? (selectedArticle as ArticlePrepaByRefArticle).quantity
                        : (selectedArticle as ArticlePrepa).quantite,
                    date_pickup: moment().format(),
                    location_from: isSelectableByUser
                        ? (selectedArticle as ArticlePrepaByRefArticle).location
                        : (selectedArticle as ArticlePrepa).emplacement,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: isSelectableByUser
                        ? null
                        : (selectedArticle as ArticlePrepa).is_ref,
                    id_article_prepa: isSelectableByUser
                        ? null
                        : (selectedArticle as ArticlePrepa).id,
                    id_prepa: this.preparation.id,
                    id_article_livraison: null,
                    id_livraison: null
                };
                let articleAlready;
                if (!isSelectableByUser) {
                    articleAlready = this.articlesT.find(art => (
                        (art.id_prepa === mouvement.id_prepa) &&
                        (art.is_ref === mouvement.is_ref) &&
                        (art.reference === mouvement.reference)
                    ));
                }


                if (articleAlready) { // we don't enter here if it's an article selected by the user in the liste of article_prepa_by_ref_article
                    this.sqliteProvider
                        .updateArticlePrepaQuantity(articleAlready.id, mouvement.quantity + articleAlready.quantite)
                        .pipe(flatMap(() => this.sqliteProvider.deleteById('`article_prepa`', (selectedArticle as ArticlePrepa).id)))
                        .subscribe(() => {
                            this.updateLists();
                        });
                }
                else {
                    this.sqliteProvider
                        .insert('`mouvement`', mouvement)
                        .pipe(flatMap(() => this.selectAnArticle(selectedArticle)))
                        .subscribe(() => {
                            this.updateLists();
                        });
                }
            }
        }
    }


    goHome() {
        this.navCtrl.setRoot(MenuPage);
    }

    validate() {
        if (this.articlesNT.length > 0) {
            this.showToast('Veuillez traiter tous les articles concernés');
        } else {
            this.navCtrl.push(PreparationEmplacementPage, {preparation: this.preparation})
        }
    }

    public testIfBarcodeEquals(selectedArticleGiven: ArticlePrepa|string, fromClick = false): void {
        let selectedArticle: ArticlePrepa = (
            !fromClick // selectedArticleGiven is a barcode
                ? this.articlesNT.find(article => ((article.reference === selectedArticleGiven)))
                : (selectedArticleGiven as ArticlePrepa) // if it's a click we have the article directly
        );


        // if we scan an article which is not in the list
        // Then we check if it's linked to a refArticle in the list
        if (!fromClick && !selectedArticle) {
            this.getArticleByBarcode(selectedArticleGiven as string).subscribe((result) => {
                // result = {selectedArticle, refArticle}
                this.navigateToPreparationTake(result);
            });
        }
        else if (selectedArticle && (selectedArticle as ArticlePrepa).type_quantite === 'article') {
            this.navCtrl.push(PreparationRefArticlesPage, {
                article: selectedArticle,
                getArticleByBarcode: (barcode: string) => this.getArticleByBarcode(barcode),
                selectArticle:
            });
        }
        else {
            this.navigateToPreparationTake({selectedArticle: (selectedArticle as ArticlePrepa)});
        }

    }

    private getArticleByBarcode(barcode: string): Observable<{selectedArticle?: ArticlePrepaByRefArticle, refArticle?: ArticlePrepa}> {
        return this.sqliteProvider.findBy('article_prepa_by_ref_article', [`reference LIKE ${barcode}`]).pipe(
            // we get the article
            map((result) => (
                (result && result.length > 0)
                    ? result[0]
                    : undefined
            )),
            flatMap((selectedArticle?: ArticlePrepaByRefArticle) => (
                !selectedArticle
                    ? of({selectedArticle})
                    : (
                        this.sqliteProvider
                            .findByElement('article_prepa', 'reference', selectedArticle.reference_article)
                            .pipe(map((refArticle) => (
                                refArticle
                                    ? ({ selectedArticle, refArticle })
                                    : {selectedArticle: undefined}
                            ))

                    )

            )))
        );
    }

    private navigateToPreparationTake({selectedArticle, refArticle}: {selectedArticle?: ArticlePrepaByRefArticle|ArticlePrepa, refArticle?: ArticlePrepa}): void {
        if (selectedArticle) {
            this.navCtrl.push(PreparationArticleTakePage, {
                article: selectedArticle,
                refArticle,
                preparation: this.preparation,
                started: this.started,
                valid: this.isValid
            });
        }
        else {
            this.showToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private updateLists(): void {
        this.sqliteProvider.findArticlesByPrepa(this.preparation.id).subscribe((articlesPrepa: Array<ArticlePrepa>) => {
            this.articlesNT = articlesPrepa.filter(article => article.has_moved === 0);
            this.articlesT = articlesPrepa.filter(article => article.has_moved === 1);
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            }
            else {
                this.refresh();
            }
        });
    }

    private selectAnArticle(selectedArticle, selectedQuantity?: number): Observable<any> {
        return ((selectedArticle as ArticlePrepaByRefArticle).isSelectableByUser)
            ? this.sqliteProvider.insert('article_prepa', {
                label: (selectedArticle as ArticlePrepaByRefArticle).label,
                reference: (selectedArticle as ArticlePrepaByRefArticle).reference,
                is_ref: 1,
                has_moved: 1,
                emplacement: (selectedArticle as ArticlePrepaByRefArticle).reference,
                quantite: selectedQuantity ? selectedQuantity : (selectedArticle as ArticlePrepaByRefArticle).quantity
            }).pipe(flatMap(() => this.sqliteProvider.deleteById('article_prepa_by_ref_article', selectedArticle.id)))
            : this.sqliteProvider.moveArticle((selectedArticle as ArticlePrepa).id)
    }

}
