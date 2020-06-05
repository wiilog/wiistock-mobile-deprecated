import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Preparation} from '@entities/preparation';
import {ArticlePrepa} from '@entities/article-prepa';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite.service';
import {NavService} from '@app/common/services/nav.service';
import {Network} from '@ionic-native/network/ngx';
import {ApiService} from '@app/common/services/api.service';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';
import {flatMap, map} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {Mouvement} from '@entities/mouvement';
import * as moment from 'moment';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PreparationEmplacementPageRoutingModule} from '@pages/stock/preparation/preparation-emplacement/preparation-emplacement-routing.module';
import {PreparationRefArticlesPageRoutingModule} from '@pages/stock/preparation/preparation-ref-articles/preparation-ref-articles-routing.module';
import {PreparationArticleTakePageRoutingModule} from '@pages/stock/preparation/preparation-article-take/preparation-article-take-routing.module';


@Component({
    selector: 'wii-preparation-articles',
    templateUrl: './preparation-articles.page.html',
    styleUrls: ['./preparation-articles.page.scss'],
})
export class PreparationArticlesPage {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public preparation: Preparation;
    public articlesNT: Array<ArticlePrepa>;
    public articlesT: Array<ArticlePrepa>;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public preparationsHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: string;
        info?: string;
    };

    public started: boolean = false;
    public isValid: boolean = true;

    public loadingStartPreparation: boolean;

    public constructor(private navService: NavService,
                       private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private network: Network,
                       private apiService: ApiService) {
        this.loadingStartPreparation = false;
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.preparation = navParams.get('preparation');
        this.preparationsHeaderConfig = {
            leftIcon: {name: 'preparation.svg'},
            title: `Préparation ${this.preparation.numero}`,
            subtitle: `Destination : ${this.preparation.destination ? this.preparation.destination : ''}`,
            info: `Flux : ${this.preparation.type}`
        };

        this.listBoldValues = ['reference', 'referenceArticleReference', 'label', 'barCode', 'location', 'quantity'];

        this.updateLists()
            .subscribe(() => {
                if (this.articlesT.length > 0) {
                    this.started = true;
                }
            });

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public saveSelectedArticle(selectedArticle: ArticlePrepa | ArticlePrepaByRefArticle, selectedQuantity: number): void {
        // if preparation is valid
        if (this.isValid) {
            // check if article is managed by 'article'
            const isSelectableByUser = ((selectedArticle as ArticlePrepaByRefArticle).isSelectableByUser);
            const availableQuantity = isSelectableByUser
                ? (selectedArticle as ArticlePrepaByRefArticle).quantity
                : (selectedArticle as ArticlePrepa).quantite;

            // if the quantity selected is smaller than the requested quantity
            if (availableQuantity !== selectedQuantity) {
                const {id_prepa, is_ref, reference} = (selectedArticle as ArticlePrepa);

                // check if we alreay have selected the article
                let articleAlready = this.articlesT.find(art => (
                    (art.id_prepa === id_prepa) &&
                    (art.is_ref === is_ref) &&
                    (art.reference === reference)
                ));

                // the article is already selected
                if (articleAlready) {
                    // we update the quantity in the list of treated article
                    // then we update quantity in the list of untreated articles
                    of(undefined)
                        .pipe(
                            flatMap(() => this.sqliteService.updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), Number(selectedQuantity) + Number(articleAlready.quantite))),
                            flatMap(() => this.sqliteService.updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), (selectedArticle as ArticlePrepa).quantite - selectedQuantity))
                        )
                        .subscribe(() => {
                            this.updateViewLists();
                        });
                }

                // the selection is a picking
                else if (isSelectableByUser) {
                    this.moveArticle(selectedArticle, selectedQuantity)
                        .subscribe(() => {
                            this.updateViewLists();
                        });
                }
                else {
                    // we update value quantity of selected article
                    this.sqliteService
                        .updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), (selectedArticle as ArticlePrepa).quantite - selectedQuantity)
                        .pipe(flatMap(() => this.moveArticle(selectedArticle, selectedQuantity)))
                        .subscribe(() => {
                            this.updateViewLists();
                        })
                }
            }
            // if we select all the article
            else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: selectedArticle.reference,
                    selected_by_article: isSelectableByUser ? 1 : 0,
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
                        ? 0
                        : (selectedArticle as ArticlePrepa).is_ref,
                    id_article_prepa: isSelectableByUser
                        ? null
                        : (selectedArticle as ArticlePrepa).id,
                    id_prepa: this.preparation.id,
                    id_article_livraison: null,
                    id_livraison: null,
                    id_article_collecte: null,
                    id_collecte: null,
                };
                let articleAlready;
                if (!isSelectableByUser) {
                    articleAlready = this.articlesT.find(art => (
                        (art.id_prepa === mouvement.id_prepa) &&
                        (art.is_ref === mouvement.is_ref) &&
                        (art.reference === mouvement.reference)
                    ));
                }

                if (articleAlready) {
                    // we don't enter here if it's an article selected by the user in the liste of article_prepa_by_ref_article
                    this.sqliteService
                        .updateArticlePrepaQuantity(articleAlready.reference, articleAlready.id_prepa, Number(articleAlready.is_ref), mouvement.quantity + articleAlready.quantite)
                        .pipe(flatMap(() => this.sqliteService.deleteArticlePrepa(articleAlready.reference, articleAlready.id_prepa, Number(articleAlready.is_ref))))
                        .subscribe(() => this.updateViewLists());
                } else {
                    this.moveArticle(selectedArticle)
                        .subscribe(() => {
                            this.updateViewLists();
                        });
                }
            }
        }
    }

    private refreshOver(): void {
        this.loadingStartPreparation = false;
        this.toastService.presentToast('Préparation prête à être finalisée.')
    }

    private refresh(): void {
        this.loadingStartPreparation = false;
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    private selectArticle(selectedArticle: ArticlePrepa | ArticlePrepaByRefArticle, selectedQuantity: number): void {
        if (selectedArticle && selectedQuantity) {
            // we start preparation
            if (!this.started) {
                if (this.network.type !== 'none') {
                    this.loadingStartPreparation = true;
                    this.apiService.requestApi('post', ApiService.BEGIN_PREPA, {params: {id: this.preparation.id}}).subscribe((resp) => {
                        if (resp.success) {
                            this.started = true;
                            this.isValid = true;
                            this.sqliteService.startPrepa(this.preparation.id).subscribe(() => {
                                this.toastService.presentToast('Préparation commencée.');
                                this.saveSelectedArticle(selectedArticle, selectedQuantity);
                            });
                        }
                        else {
                            this.isValid = false;
                            this.loadingStartPreparation = false;
                            this.toastService.presentToast(resp.msg);
                        }
                    });
                }
                else {
                    this.toastService.presentToast('Vous devez être connecté à internet pour commencer la préparation');
                }
            } else {
                this.saveSelectedArticle(selectedArticle, selectedQuantity);
            }
        }
    }

    public validate(): void {
        if ((this.articlesT.length === 0) ||
            this.articlesT.every(({quantite}) => (!quantite || quantite === 0))) {
            this.toastService.presentToast('Veuillez traiter au moins un article');
        }
        else {
            this.navService.push(PreparationEmplacementPageRoutingModule.PATH, {
                preparation: this.preparation,
                validatePrepa: () => {
                    this.navService.pop();
                }
            });
        }
    }

    public testIfBarcodeEquals(selectedArticleGiven: ArticlePrepa | string, fromClick = false): void {
        let selectedArticle: ArticlePrepa = (
            !fromClick // selectedArticleGiven is a barcode
                ? this.articlesNT.find(article => ((article.barcode === selectedArticleGiven)))
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
            this.navService.push(PreparationRefArticlesPageRoutingModule.PATH, {
                article: selectedArticle,
                preparation: this.preparation,
                started: this.started,
                valid: this.isValid,
                getArticleByBarcode: (barcode: string) => this.getArticleByBarcode(barcode),
                selectArticle: (selectedQuantity: number, selectedArticleByRef: ArticlePrepaByRefArticle) => this.selectArticle(selectedArticleByRef, selectedQuantity)
            });
        }
        else {
            this.navigateToPreparationTake({selectedArticle: (selectedArticle as ArticlePrepa)});
        }
    }

    private getArticleByBarcode(barcode: string): Observable<{ selectedArticle?: ArticlePrepaByRefArticle, refArticle?: ArticlePrepa }> {
        return this.sqliteService.findBy('article_prepa_by_ref_article', [`barcode LIKE '${barcode}'`]).pipe(
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
                        this.sqliteService
                            .findOneBy('article_prepa', {reference: selectedArticle.reference_article, is_ref: 1, id_prepa: this.preparation.id}, 'AND')
                            .pipe(map((refArticle) => (
                                    refArticle
                                        ? ({selectedArticle, refArticle})
                                        : {selectedArticle: undefined}
                                ))
                            )
                    )))
        );
    }

    private navigateToPreparationTake({selectedArticle, refArticle}: { selectedArticle?: ArticlePrepaByRefArticle | ArticlePrepa, refArticle?: ArticlePrepa }): void {
        if (selectedArticle) {
            this.navService.push(PreparationArticleTakePageRoutingModule.PATH, {
                article: selectedArticle,
                refArticle,
                preparation: this.preparation,
                started: this.started,
                valid: this.isValid,
                selectArticle: (selectedQuantity: number) => this.selectArticle(selectedArticle, selectedQuantity)
            });
        } else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private updateLists(): Observable<undefined> {
        return this.sqliteService.findArticlesByPrepa(this.preparation.id).pipe(
            flatMap((articlesPrepa: Array<ArticlePrepa>) => {
                this.articlesNT = articlesPrepa.filter(({has_moved}) => has_moved === 0);
                this.articlesT = articlesPrepa.filter(({has_moved}) => has_moved === 1);

                this.listToTreatConfig = this.createListToTreatConfig();
                this.listTreatedConfig = this.ceateListTreatedConfig();

                return of(undefined);
            }));
    }

    private updateViewLists(): void {
        this.updateLists().subscribe(() => {
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            } else {
                this.refresh();
            }
        });
    }

    private moveArticle(selectedArticle, selectedQuantity?: number): Observable<any> {
        const selectedQuantityValid = selectedQuantity ? selectedQuantity : (selectedArticle as ArticlePrepaByRefArticle).quantity;
        let articleToInsert: ArticlePrepa = {
            label: (selectedArticle as ArticlePrepaByRefArticle).label,
            reference: (selectedArticle as ArticlePrepaByRefArticle).reference,
            is_ref: 1,
            has_moved: 1,
            id_prepa: this.preparation.id,
            isSelectableByUser: 1,
            emplacement: (selectedArticle as ArticlePrepaByRefArticle).location,
            quantite: selectedQuantityValid,
            reference_article_reference: selectedArticle.reference_article_reference,
        };
        return ((selectedArticle as ArticlePrepaByRefArticle).isSelectableByUser)
            ? of(undefined)
                .pipe(
                    flatMap(() => this.sqliteService.insert('article_prepa', articleToInsert)),
                    flatMap((insertId) => (
                        this.insertMouvement(
                            selectedArticle as ArticlePrepaByRefArticle & ArticlePrepa,
                            selectedQuantityValid,
                            insertId
                        )
                    )),
                    flatMap(() => this.sqliteService.deleteBy('article_prepa_by_ref_article', selectedArticle.id)),
                    flatMap(() => this.updateLists()),

                    // delete articlePrepa if all quantity has been selected
                    flatMap(() => (
                        this.sqliteService.findOneBy('article_prepa', {
                            reference: (selectedArticle as ArticlePrepaByRefArticle).reference_article,
                            is_ref: 1,
                            id_prepa: this.preparation.id
                        }, 'AND')
                    )),
                    flatMap((referenceArticle) => {

                        // we get all quantity picked for this refArticle plus the current quantity which is selected
                        const quantityPicked = this.articlesT.reduce((acc: number, article: ArticlePrepa) => (
                            acc +
                            ((article.isSelectableByUser && ((selectedArticle as ArticlePrepaByRefArticle).reference_article === article.reference))
                                ? Number(article.quantite)
                                : 0)
                        ), selectedQuantityValid);

                        return (referenceArticle.quantite === quantityPicked)
                            ? this.sqliteService.deleteArticlePrepa(referenceArticle.reference, referenceArticle.id_prepa, 1)
                            : this.sqliteService.updateArticlePrepaQuantity(referenceArticle.reference, referenceArticle.id_prepa, 1, referenceArticle.quantite - selectedQuantityValid)
                    })
                )
            : (selectedQuantity
                    ? of(undefined)
                        .pipe(
                            flatMap(() => this.sqliteService.insert('article_prepa', articleToInsert)),
                            flatMap((insertId) => (
                                    this.insertMouvement(selectedArticle as ArticlePrepaByRefArticle & ArticlePrepa, selectedQuantityValid, insertId).pipe(
                                        flatMap(() => this.sqliteService.moveArticle(insertId))
                                    )
                                )
                            ))
                    : of(undefined)
                        .pipe(
                            flatMap(() => this.insertMouvement(selectedArticle as ArticlePrepaByRefArticle & ArticlePrepa, selectedQuantityValid)),
                            flatMap(() => this.sqliteService.moveArticle((selectedArticle as ArticlePrepa).id))
                        )
            )
    }

    private insertMouvement(selectedArticle: ArticlePrepaByRefArticle & ArticlePrepa, quantity: number, insertId?: number): Observable<number> {
        if (!this.articlesT.some(art => art.reference === selectedArticle.reference)) {
            let mouvement: Mouvement = {
                id: null,
                reference: selectedArticle.reference,
                quantity: quantity ? quantity : selectedArticle.quantite,
                date_pickup: moment().format(),
                location_from: selectedArticle.location ? selectedArticle.location : selectedArticle.emplacement,
                date_drop: null,
                location: null,
                type: 'prise-dépose',
                is_ref: selectedArticle.isSelectableByUser ? 0 : selectedArticle.is_ref,
                selected_by_article: selectedArticle.isSelectableByUser ? 1 : 0,
                id_article_prepa: insertId ? insertId : selectedArticle.id,
                id_prepa: this.preparation.id,
                id_article_livraison: null,
                id_article_collecte: null,
                id_collecte: null,
                id_livraison: null
            };
            return this.sqliteService.insert('`mouvement`', mouvement);
        } else {
            return of(undefined);
        }
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesNumber = (this.articlesNT ? this.articlesNT.length : 0);
        const articlesPlural = articlesNumber > 1 ? 's' : '';
        return articlesNumber > 0
            ? {
                header: {
                    title: 'À préparer',
                    info: `${articlesNumber} article${articlesPlural} à scanner`,
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-blue-light'
                    }
                },
                body: this.articlesNT.map((articlePrepa: ArticlePrepa) => ({
                    infos: this.createArticleInfo(articlePrepa),
                    rightIcon: {
                        color: 'grey' as IconColor,
                        name: 'up.svg',
                        action: () => {
                            this.testIfBarcodeEquals(articlePrepa, true)
                        }
                    }
                }))
            }
            : undefined;
    }

    private ceateListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const pickedArticlesNumber = (this.articlesT ? this.articlesT.length : 0);
        const pickedArticlesPlural = pickedArticlesNumber > 1 ? 's' : '';
        return {
            header: {
                title: 'Préparé',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} scanné${pickedArticlesPlural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-blue'
                },
                rightIcon: {
                    name: 'check.svg',
                    color: 'success',
                    action: () => {
                        this.validate()
                    }
                }
            },
            body: this.articlesT.map((articlePrepa: ArticlePrepa) => ({
                infos: this.createArticleInfo(articlePrepa)
            }))
        };
    }

    private createArticleInfo({reference, is_ref, reference_article_reference, label,  barcode, emplacement, quantite}: ArticlePrepa): {[name: string]: { label: string; value: string; }} {
        return {
            reference: {
                label: 'Référence',
                value: reference
            },
            ...(
                !is_ref && reference_article_reference
                    ? {
                        referenceArticleReference: {
                            label: 'Référence article',
                            value: reference_article_reference
                        }
                    }
                    : {}
            ),
            label: {
                label: 'Libellé',
                value: label
            },
            ...(
                barcode
                    ? {
                        barCode: {
                            label: 'Code barre',
                            value: barcode
                        }
                    }
                    : {}
            ),
            ...(
                emplacement && emplacement !== 'null'
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: emplacement
                        }
                    }
                    : {}
            ),
            ...(
                quantite
                    ? {
                        quantity: {
                            label: 'Quantité',
                            value: `${quantite}`
                        }
                    }
                    : {}
            )
        };
    }

}
