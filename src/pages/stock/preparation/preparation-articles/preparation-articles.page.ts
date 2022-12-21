import {Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {Preparation} from '@entities/preparation';
import {ArticlePrepa} from '@entities/article-prepa';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {ApiService} from '@app/common/services/api.service';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';
import {Observable, of, zip} from 'rxjs';
import {flatMap, map, mergeMap, tap} from 'rxjs/operators';
import {Mouvement} from '@entities/mouvement';
import * as moment from 'moment';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {NetworkService} from '@app/common/services/network.service';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {Nature} from "@entities/nature";
import {LoadingService} from "@app/common/services/loading.service";
import {ArticleLivraison} from "@entities/article-livraison";


@Component({
    selector: 'wii-preparation-articles',
    templateUrl: './preparation-articles.page.html',
    styleUrls: ['./preparation-articles.page.scss'],
})
export class PreparationArticlesPage extends PageComponent {

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
        subtitle?: Array<string>;
        info?: string;
    };

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public started: boolean = false;
    public isValid: boolean = true;

    public loadingStartPreparation: boolean;
    public displayTargetLocationPicking: boolean = false;
    public skipValidation: boolean = false;
    public skipQuantities: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
        this.loadingStartPreparation = false;
    }

    public ionViewWillEnter(): void {
        this.preparation = this.currentNavParams.get('preparation');
        this.preparationsHeaderConfig = {
            leftIcon: {name: 'preparation.svg'},
            title: `Préparation ${this.preparation.numero}`,
            subtitle: [
                `Destination : ${this.preparation.destination ? this.preparation.destination : ''}`,
                this.preparation.comment ? `Commentaire : ${this.preparation.comment}` : undefined
            ],
            info: `Flux : ${this.preparation.type}`
        };

        this.listBoldValues = ['reference', 'referenceArticleReference', 'label', 'barCode', 'location', 'quantity', 'targetLocationPicking', 'logisticUnit', 'articlesCount', 'nature'];

        zip(
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_PREPARATIONS),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_PREPARATIONS),
            this.updateLists()
        ).subscribe(([skipValidation, skipQuantities]) => {
            this.skipValidation = skipValidation;
            this.skipQuantities = skipQuantities;
            if (this.articlesT.length > 0) {
                this.started = true;
            }

            if (this.footerScannerComponent) {
                this.footerScannerComponent.fireZebraScan();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public saveSelectedArticle(selectedArticle: ArticlePrepa | ArticlePrepaByRefArticle, selectedQuantity: number): Observable<any> {
        const validateAfterSelect = () => {
            if (this.skipValidation
                && this.articlesT.length > 0
                && this.articlesNT.length === 0) {
                this.validate();
            }
        };

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
                    return of(undefined)
                        .pipe(
                            mergeMap(() => this.sqliteService.updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), Number(selectedQuantity) + Number(articleAlready.quantite))),
                            mergeMap(() => this.sqliteService.updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), (selectedArticle as ArticlePrepa).quantite - selectedQuantity)),
                            mergeMap(() => this.updateViewLists()),
                            tap(() => validateAfterSelect())
                        );
                }

                // the selection is a picking
                else if (isSelectableByUser) {
                    return this.moveArticle(selectedArticle, selectedQuantity)
                        .pipe(
                            mergeMap(() => this.updateViewLists()),
                            tap(() => validateAfterSelect())
                        );
                } else {
                    // we update value quantity of selected article
                    return this.sqliteService
                        .updateArticlePrepaQuantity(reference, id_prepa, Number(is_ref), (selectedArticle as ArticlePrepa).quantite - selectedQuantity)
                        .pipe(
                            mergeMap(() => this.moveArticle(selectedArticle, selectedQuantity)),
                            mergeMap(() => this.updateViewLists()),
                            tap(() => validateAfterSelect())
                        );
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
                    return this.sqliteService
                        .updateArticlePrepaQuantity(articleAlready.reference, articleAlready.id_prepa, Number(articleAlready.is_ref), mouvement.quantity + articleAlready.quantite)
                        .pipe(
                            mergeMap(() => this.sqliteService.deleteArticlePrepa(articleAlready.reference, articleAlready.id_prepa, Number(articleAlready.is_ref))),
                            mergeMap(() => this.updateViewLists()),
                            tap(() => validateAfterSelect())
                        );
                } else {
                    return this.moveArticle(selectedArticle)
                        .pipe(
                            mergeMap(() => this.updateViewLists()),
                            tap(() => validateAfterSelect())
                        );
                }
            }
        } else {
            return of(undefined);
        }
    }

    private selectArticle(selectedArticle, selectedQuantity: number = undefined): void {
        const articles = Array.isArray(selectedArticle) ? selectedArticle : [selectedArticle];

        if (selectedArticle) {
            // we start preparation
            if (!this.started) {
                if (this.networkService.hasNetwork()) {
                    this.loadingStartPreparation = true;
                    this.loadingService.presentLoadingWhile({
                        event: () => (
                            this.apiService
                                .requestApi(ApiService.BEGIN_PREPA, {params: {id: this.preparation.id}})
                                .pipe(
                                    mergeMap(({success, msg}) => {
                                        if (success) {
                                            this.started = true;
                                            this.isValid = true;

                                            return this.sqliteService.startPrepa(this.preparation.id)
                                                .pipe(
                                                    mergeMap(() => zip(
                                                        ...articles
                                                            .map((article: ArticlePrepa | ArticlePrepaByRefArticle) =>
                                                                this.saveSelectedArticle(article, selectedQuantity || (`quantity` in article ? article.quantity : article.quantite))))),
                                                    map(() => `Préparation commencée`)
                                                );
                                        } else {
                                            this.isValid = false;
                                            this.loadingStartPreparation = false;
                                            return of(msg);
                                        }
                                    })
                                )
                        )
                    }).subscribe((resp) => {
                        this.toastService.presentToast(resp);
                    });
                } else {
                    this.toastService.presentToast('Vous devez être connecté à internet pour commencer la préparation');
                }
            } else {
                this.saveSelectedArticle(selectedArticle, selectedQuantity)
                    .subscribe(() => {/*Keep subscribe*/});
            }
        }
    }

    public validate(): void {
        if ((this.articlesT.length === 0) ||
            this.articlesT.every(({quantite}) => (!quantite || quantite === 0))) {
            this.toastService.presentToast('Veuillez traiter au moins un article');
        } else {
            this.navService.push(NavPathEnum.PREPARATION_EMPLACEMENT, {
                preparation: this.preparation,
                validatePrepa: () => {
                    this.navService.pop();
                }
            });
        }
    }

    public testIfBarcodeEquals(selectedArticleGiven: ArticlePrepa | string, fromClick = false): void {
        const logisticUnits = (articles) => articles
            .filter((article: ArticlePrepa) => article.lineLogisticUnitCode)
            .map((article: ArticlePrepa) => article.lineLogisticUnitCode)
            .filter((code: string, index, logisticUnitCodes) => index === logisticUnitCodes.indexOf(code));

        const logisticUnit = logisticUnits(this.articlesNT).find((logisticUnit: string) => logisticUnit === selectedArticleGiven);

        let selectedArticle: ArticlePrepa = (
            !fromClick // selectedArticleGiven is a barcode
                ? this.articlesNT.find(article => ((article.barcode === selectedArticleGiven)))
                : (selectedArticleGiven as ArticlePrepa) // if it's a click we have the article directly
        );

        if (selectedArticle && selectedArticle.lineLogisticUnitId) {
            this.toastService.presentToast(`Cet article est présent dans l'unité logistique <strong>${selectedArticle.lineLogisticUnitCode}</strong>, vous ne pouvez pas le préparer seul.`);
        } else {
            if (logisticUnit) {
                const articles = this.articlesNT.filter((article: ArticlePrepa) => article.lineLogisticUnitCode === logisticUnit);
                this.selectArticle(articles);
            } else if (!fromClick && !selectedArticle) {
                // if we scan an article which is not in the list
                // Then we check if it's linked to a refArticle in the list
                this.getArticleByBarcode(selectedArticleGiven as string).subscribe((result) => {
                    // result = {selectedArticle, refArticle}
                    this.navigateToPreparationTake(result);
                });
            } else if (selectedArticle && (selectedArticle as ArticlePrepa).type_quantite === 'article') {
                this.navService.push(NavPathEnum.PREPARATION_REF_ARTICLES, {
                    article: selectedArticle,
                    preparation: this.preparation,
                    started: this.started,
                    valid: this.isValid,
                    getArticleByBarcode: (barcode: string) => this.getArticleByBarcode(barcode),
                    selectArticle: (selectedQuantity: number, selectedArticleByRef: ArticlePrepaByRefArticle) => this.selectArticle(selectedArticleByRef, selectedQuantity)
                });
            } else if (this.skipQuantities) {
                this.selectArticle(selectedArticle, selectedArticle.quantite);
            } else {
                this.navigateToPreparationTake({selectedArticle: (selectedArticle as ArticlePrepa)});
            }
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
            mergeMap((selectedArticle?: ArticlePrepaByRefArticle) => (
                !selectedArticle
                    ? of({selectedArticle})
                    : (
                        this.sqliteService
                            .findOneBy('article_prepa', {
                                reference: selectedArticle.reference_article,
                                is_ref: 1,
                                id_prepa: this.preparation.id
                            }, 'AND')
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
            const referenceArticleIsToTreat = !refArticle || this.articlesNT.some((articlePrepa) => articlePrepa.reference === refArticle.reference);
            if (referenceArticleIsToTreat) {
                if (this.skipQuantities) {
                    const quantityToSelect = refArticle
                        ? Math.min((selectedArticle as ArticlePrepaByRefArticle).quantity, refArticle.quantite)
                        : (selectedArticle as ArticlePrepaByRefArticle).quantity;
                    this.selectArticle(selectedArticle, quantityToSelect);
                } else {
                    this.navService.push(NavPathEnum.PREPARATION_ARTICLE_TAKE, {
                        article: selectedArticle,
                        refArticle,
                        preparation: this.preparation,
                        started: this.started,
                        valid: this.isValid,
                        selectArticle: (selectedQuantity: number) => this.selectArticle(selectedArticle, selectedQuantity)
                    });
                }
            } else {
                this.toastService.presentToast(`Aucune quantité à préparer pour cette référence`);
            }
        } else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
        }
    }

    private updateLists(): Observable<undefined> {
        return zip(
            this.sqliteService.findBy('article_prepa', [`id_prepa = ${this.preparation.id}`, `deleted <> 1`]),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_TARGET_LOCATION_PICKING),
        ).pipe(
            flatMap(([articlesPrepa, displayTargetLocationPicking]: [Array<ArticlePrepa>, boolean]) => {
                this.articlesNT = articlesPrepa.filter(({has_moved}) => has_moved === 0);
                this.articlesT = articlesPrepa.filter(({has_moved}) => has_moved === 1);

                this.displayTargetLocationPicking = displayTargetLocationPicking;

                this.listToTreatConfig = this.createListToTreatConfig();
                this.listTreatedConfig = this.createListTreatedConfig();

                return of(undefined);
            }));
    }

    private updateViewLists(): Observable<void> {
        return this.updateLists()
            .pipe(tap(() => {
                this.loadingStartPreparation = false;
                if (this.articlesNT.length === 0) {
                    this.toastService.presentToast('Préparation prête à être finalisée.');
                } else {
                    this.toastService.presentToast('Quantité bien prélevée.');
                }
            }));
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
                    flatMap(() => this.sqliteService.deleteBy('article_prepa_by_ref_article', [`id = ${selectedArticle.id}`])),
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
            return this.sqliteService.insert('mouvement', mouvement);
        } else {
            return of(undefined);
        }
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticlePrepa) => !article.is_ref && !article.lineLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticlePrepa) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesNT
            ? this.articlesNT
                .filter((article: ArticlePrepa) => article.lineLogisticUnitId)
                .map((article: ArticlePrepa) => article.lineLogisticUnitId)
                .filter((id: number, index, logisticUnitIds) => index === logisticUnitIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesNT
            ? this.articlesNT
                .filter((article: ArticlePrepa) => article.lineLogisticUnitId)
                .length
            : 0;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} à scanner`,
            `${referencesCount} référence${referencesCount > 1 ? 's' : ''} à scanner`,
            `${logisiticUnitsCount} UL à scanner`,
            `${articlesInLogisticUnitCount} article${articlesInLogisticUnitCount > 1 ? 's' : ''} contenu${articlesInLogisticUnitCount > 1 ? 's' : ''}`
        ];

        return articlesCount > 0 || referencesCount > 0 || logisiticUnitsCount > 0 || articlesInLogisticUnitCount > 0
            ? {
                header: {
                    title: 'À préparer',
                    info: `${content.join(', ')}`,
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-blue-light'
                    },
                    rightIcon: {
                        color: 'primary',
                        name: 'scan-photo.svg',
                        action: () => {
                            this.footerScannerComponent.scan();
                        }
                    }
                },
                body: this.getBodyConfig(this.articlesNT, true)
            } : undefined;
    }

    private createListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesCount = this.articlesT
            ? this.articlesT.filter((article: ArticlePrepa) => !article.is_ref && !article.lineLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesT
            ? this.articlesT.filter((article: ArticlePrepa) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesT
            ? this.articlesT
                .filter((article: ArticlePrepa) => article.lineLogisticUnitId)
                .map((article: ArticlePrepa) => article.lineLogisticUnitId)
                .filter((id: number, index, articleIds) => index === articleIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesT
            ? this.articlesT
                .filter((article: ArticlePrepa) => article.lineLogisticUnitId)
                .length
            : 0;

        const content = [
            `${articlesCount} article${articlesCount > 1 ? 's' : ''} scanné${articlesCount > 1 ? 's' : ''}`,
            `${referencesCount} référence${referencesCount > 1 ? 's' : ''} scannée${referencesCount > 1 ? 's' : ''}`,
            `${logisiticUnitsCount} UL scannée${logisiticUnitsCount > 1 ? 's' : ''}`,
            `${articlesInLogisticUnitCount} article${articlesInLogisticUnitCount > 1 ? 's' : ''} contenu${articlesInLogisticUnitCount > 1 ? 's' : ''}`
        ];

        return {
            header: {
                title: 'Préparé',
                info: `${content.join(', ')}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-blue'
                }
            },
            body: this.getBodyConfig(this.articlesT)
        };
    }

    private createArticleInfo({reference, is_ref, reference_article_reference, label, barcode, emplacement, quantite, targetLocationPicking}: ArticlePrepa): { [name: string]: { label: string; value: string; } } {
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
            ),
            ...(
                this.displayTargetLocationPicking
                    ? {
                        targetLocationPicking: {
                            label: 'Emplacement cible picking',
                            value: `${targetLocationPicking || '-'}`
                        }
                    }
                    : {}
            )
        };
    }

    private getBodyConfig(articles: Array<ArticlePrepa>, notTreatedList: boolean = false) {
        const groupedArticlesByLogisticUnit = articles
            .reduce((acc, article) => {
                (acc[article['lineLogisticUnitCode']] = acc[article['lineLogisticUnitCode']] || []).push(article);
                return acc;
            }, {});

        let bodyConfig = [];
        Object.keys(groupedArticlesByLogisticUnit).map((logisticUnit?: string) => {
            const articles = groupedArticlesByLogisticUnit[logisticUnit];

            if (logisticUnit !== `null`) {
                const firstArticle = articles[0];

                this.sqliteService.findOneBy(`nature`, {id: firstArticle.lineLogisticUnitNatureId})
                    .subscribe((nature: Nature) => {
                        bodyConfig.push({
                            infos: this.createLogisticUnitInfo(articles, logisticUnit, nature ? nature.label : undefined, firstArticle.lineLogisticUnitLocation),
                            ...nature ? ({
                                color: nature.color
                            }) : {},
                            ...notTreatedList ? ({
                                rightIcon: {
                                    color: 'grey' as IconColor,
                                    name: 'up.svg',
                                    action: () => {
                                        this.testIfBarcodeEquals(logisticUnit, false)
                                    }
                                },
                                pressAction: () => this.showLogisticUnitContent(articles, logisticUnit)
                            }) : {},
                        })
                    })
            } else {
                articles.forEach((article) => {
                    bodyConfig.push({
                        infos: this.createArticleInfo(article),
                        ...notTreatedList ? ({
                            rightIcon: {
                                color: 'grey' as IconColor,
                                name: 'up.svg',
                                action: () => {
                                    this.testIfBarcodeEquals(article.barcode, false)
                                }
                            },
                        }) : {},
                    })
                });
            }
        });

        return bodyConfig;
    }

    private createLogisticUnitInfo(articles: Array<ArticlePrepa>, logisticUnit: string, natureLabel: string, location: string) {
        const articlesCount = articles.length;

        return {
            logisticUnit: {
                label: 'Objet',
                value: logisticUnit
            },
            articlesCount: {
                label: `Nombre d'articles`,
                value: articlesCount
            },
            ...location ? ({
                location: {
                    label: `Emplacement`,
                    value: location
                }
            }) : {},
            ...natureLabel ? ({
                nature: {
                    label: `Nature`,
                    value: natureLabel
                }
            }) : {}
        }
    }

    private showLogisticUnitContent(articles: Array<ArticlePrepa>, logisticUnit: string): void {
        const filteredArticles = articles.filter((article: ArticlePrepa) => article.lineLogisticUnitCode === logisticUnit);
        const options = {
            articles: filteredArticles,
            logisticUnit,
        }
        this.navService.push(NavPathEnum.DELIVERY_LOGISTIC_UNIT_CONTENT, options);
    }

}
