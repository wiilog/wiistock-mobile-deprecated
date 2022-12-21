import {Component, ViewChild} from '@angular/core';
import {Livraison} from '@entities/livraison';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ArticleLivraison} from '@entities/article-livraison';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ApiService} from '@app/common/services/api.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {flatMap, map, mergeMap, tap} from 'rxjs/operators';
import * as moment from 'moment';
import {Mouvement} from '@entities/mouvement';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {NetworkService} from '@app/common/services/network.service';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {Observable, of, zip} from "rxjs";
import {Nature} from "@entities/nature";
import {LoadingService} from "@app/common/services/loading.service";


@Component({
    selector: 'wii-livraison-articles',
    templateUrl: './livraison-articles.page.html',
    styleUrls: ['./livraison-articles.page.scss'],
})
export class LivraisonArticlesPage extends PageComponent {
    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public livraison: Livraison;

    public articlesNT: Array<ArticleLivraison>;
    public articlesT: Array<ArticleLivraison>;
    public articles: Array<ArticleLivraison>;

    public listBoldValues?: Array<string>;
    public listToTreatConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public listTreatedConfig?: { header: HeaderConfig; body: Array<ListPanelItemConfig>; };
    public livraisonsHeaderConfig?: {
        leftIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    public started: boolean = false;
    public isValid: boolean = true;
    public skipValidation: boolean = false;
    public skipQuantities: boolean = false;
    public loadingStartLivraison: boolean;
    public displayTargetLocationPicking: boolean = false;

    public constructor(private toastService: ToastService,
                       private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private apiService: ApiService,
                       private storageService: StorageService,
                       navService: NavService,
                       private loadingService: LoadingService) {
        super(navService);
        this.loadingStartLivraison = false;
    }

    public ionViewWillEnter(): void {
        this.livraison = this.currentNavParams.get('livraison');

        this.livraisonsHeaderConfig = {
            leftIcon: {name: 'delivery.svg'},
            title: `Livraison ${this.livraison.number}`,
            subtitle: [
                `Destination : ${this.livraison.location}`,
                this.livraison.comment ? `Commentaire : ${this.livraison.comment}` : undefined
            ]
        };

        this.listBoldValues = ['label', 'barCode', 'location', 'quantity', 'targetLocationPicking', 'logisticUnit', 'articlesCount', 'nature'];

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        zip(
            this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_DELIVERY),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_DELIVERY),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_TARGET_LOCATION_PICKING)
        ).subscribe(([articles, skipValidation, skipQuantities, displayTargetLocationPicking]: [Array<ArticleLivraison>, boolean, boolean, boolean]) => {
            this.skipValidation = skipValidation;
            this.skipQuantities = skipQuantities;
            this.displayTargetLocationPicking = displayTargetLocationPicking;
            this.articles = articles;

            this.updateList(articles, true);
            if (this.articlesT.length > 0) {
                this.started = true;
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public selectArticle(article, deliveredQuantity: number = undefined) {
        const articles = Array.isArray(article) ? article : [article];

        if (!this.started && this.networkService.hasNetwork()) {
            this.loadingStartLivraison = true;
            this.loadingService.presentLoadingWhile({
                event: () => (
                    this.apiService
                        .requestApi(ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}}))
                        .pipe(
                            mergeMap((resp) => {
                                if (resp.success) {
                                    this.started = true;
                                    this.isValid = true;
                                    return zip(
                                        ...articles
                                            .map((article: ArticleLivraison) => this.registerMvt(article, deliveredQuantity || article.quantity))
                                    ).pipe(
                                        flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])),
                                        tap((articles) => this.updateList(articles)),
                                        map(() => `Livraison commencée.`))
                                } else {
                                    this.isValid = false;
                                    this.loadingStartLivraison = false;
                                    return of(resp.msg);
                                }
                            })
                ),
            }).subscribe((resp) => {
                this.toastService.presentToast(resp);
            });
        } else {
            if (!this.networkService.hasNetwork()) {
                this.toastService.presentToast('Livraison commencée en mode hors ligne.');
            }

            this.loadingService.presentLoadingWhile({
                event: () => zip(
                    ...articles
                        .map((article: ArticleLivraison) => this.registerMvt(article, deliveredQuantity || article.quantity))
                ).pipe(
                    flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])))
            }).subscribe((articles) => {
                this.updateList(articles);
            });
        }
    }

    public refreshOver(): void {
        this.toastService.presentToast('Livraison prête à être finalisée.').subscribe(() => {
            if (this.skipValidation) {
                this.validate();
            }
        })
    }

    public refresh(): void {
        this.toastService.presentToast('Quantité bien prélevée.')
    }

    public registerMvt(article, quantity): Observable<any> {
        if (this.isValid) {
            if (article.quantity !== Number(quantity)) {
                let newArticle: ArticleLivraison = {
                    id: null,
                    label: article.label,
                    reference: article.reference,
                    quantity: Number(quantity),
                    is_ref: article.is_ref,
                    id_livraison: article.id_livraison,
                    has_moved: 1,
                    location: article.location,
                    barcode: article.barcode,
                    targetLocationPicking: article.targetLocationPicking
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === newArticle.id_livraison && art.is_ref === newArticle.is_ref && art.reference === newArticle.reference);
                if (articleAlready !== undefined) {
                    return this.sqliteService
                        .update('article_livraison', [{
                            values: {quantity: newArticle.quantity + articleAlready.quantity},
                            where: [`id = ${articleAlready.id}`]
                        }])
                        .pipe(
                            flatMap(() => this.sqliteService.update('article_livraison', [{
                                values: {quantity: article.quantity - newArticle.quantity},
                                where: [`id = ${article.id}`]
                            }])),
                        );
                } else {
                    return this.sqliteService.insert('article_livraison', newArticle)
                        .pipe(
                            flatMap((insertId) => this.sqliteService.insert('mouvement', {
                                id: null,
                                reference: newArticle.reference,
                                quantity: article.quantity,
                                date_pickup: moment().format(),
                                location_from: newArticle.location,
                                date_drop: null,
                                location: null,
                                type: 'prise-dépose',
                                is_ref: newArticle.is_ref,
                                id_article_prepa: null,
                                id_prepa: null,
                                id_article_livraison: insertId,
                                id_livraison: newArticle.id_livraison,
                                id_article_collecte: null,
                                id_collecte: null,
                            })),
                            flatMap(() => this.sqliteService
                                .update('article_livraison', [{
                                    values: {quantity: article.quantity - Number(quantity)},
                                    where: [`id = ${article.id}`]
                                }])),
                            flatMap((mouvement: Mouvement) => this.sqliteService.insert('mouvement', mouvement)))
                }
            } else {
                let mouvement: Mouvement = {
                    id: null,
                    reference: article.reference,
                    quantity: article.quantity,
                    date_pickup: moment().format(),
                    location_from: article.location,
                    date_drop: null,
                    location: null,
                    type: 'prise-dépose',
                    is_ref: article.is_ref,
                    id_article_prepa: null,
                    id_prepa: null,
                    id_article_livraison: article.id,
                    id_livraison: article.id_livraison,
                    id_article_collecte: null,
                    id_collecte: null,
                };
                let articleAlready = this.articlesT.find(art => art.id_livraison === mouvement.id_livraison && art.is_ref === mouvement.is_ref && art.reference === mouvement.reference);
                if (articleAlready !== undefined) {
                    return this.sqliteService
                        .update('article_livraison', [{
                            values: {quantity: mouvement.quantity + articleAlready.quantity},
                            where: [`id = ${articleAlready.id}`]
                        }])
                        .pipe(
                            flatMap(() => this.sqliteService.deleteBy('article_livraison', [`id = ${mouvement.id_article_livraison}`])),
                        );
                } else {
                    return this.sqliteService
                        .insert('mouvement', mouvement)
                        .pipe(
                            flatMap(() => this.sqliteService.moveArticleLivraison(article.id))
                        );
                }
            }
        } else {
            return of(undefined);
        }
    }

    public validate(): void {
        if ((this.articlesNT.length > 0) ||
            (this.articlesT.length === 0)) {
            this.toastService.presentToast('Veuillez traiter tous les articles concernés');
        } else {
            this.navService.push(NavPathEnum.LIVRAISON_EMPLACEMENT, {
                livraison: this.livraison,
                validateLivraison: () => {
                    this.navService.pop();
                }
            });
        }
    }

    public testIfBarcodeEquals(text, fromText: boolean = true): void {
        const logisticUnits = this.articlesNT
            .filter((article: ArticleLivraison) => article.currentLogisticUnitCode)
            .map((article: ArticleLivraison) => article.currentLogisticUnitCode)
            .filter((code: string, index, logisticUnitCodes) => index === logisticUnitCodes.indexOf(code));

        const logisticUnit = logisticUnits.find((logisticUnit: string) => logisticUnit === text);

        const article = fromText
            ? this.articlesNT.find((article) => (article.barcode === text))
            : text;

        if (article && article.currentLogisticUnitId) {
            this.toastService.presentToast(`Cet article est présent dans l'unité logistique <strong>${article.currentLogisticUnitCode}</strong>, vous ne pouvez pas le livrer seul.`);
        } else {
            if (article || logisticUnit) {
                if (logisticUnit || this.skipQuantities) {
                    if (logisticUnit) {
                        const articles = this.articlesNT.filter((article: ArticleLivraison) => article.currentLogisticUnitCode === logisticUnit);
                        this.selectArticle(articles);
                    } else {
                        this.selectArticle(article);
                    }
                } else {
                    this.navService.push(NavPathEnum.LIVRAISON_ARTICLE_TAKE, {
                        article,
                        selectArticle: (quantity) => {
                            this.selectArticle(article, quantity);
                        }
                    });
                }

            } else {
                this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
            }
        }
    }

    public takeAll() {
        this.apiService
            .requestApi(ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}})
            .subscribe((resp) => {
                if (resp.success) {
                    this.started = true;
                    this.isValid = true;
                    this.toastService.presentToast('Livraison commencée.');
                    this.selectArticle(this.articlesNT);
                } else {
                    this.isValid = false;
                    this.loadingStartLivraison = false;
                    this.toastService.presentToast(resp.msg);
                }
            });
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticleLivraison) => !article.is_ref && !article.currentLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesNT
            ? this.articlesNT.filter((article: ArticleLivraison) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesNT
            ? this.articlesNT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .map((article: ArticleLivraison) => article.currentLogisticUnitId)
                .filter((id: number, index, logisticUnitIds) => index === logisticUnitIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesNT
            ? this.articlesNT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
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
                    title: 'À livrer',
                    info: content.join(`, `),
                    leftIcon: {
                        name: 'download.svg',
                        color: 'list-yellow-light'
                    },
                    rightIconLayout: 'horizontal',
                    rightIcon: [
                        {
                            color: 'primary',
                            name: 'scan-photo.svg',
                            action: () => {
                                this.footerScannerComponent.scan();
                            }
                        },
                        ...(this.skipQuantities
                            ? [{
                                name: 'up.svg',
                                action: () => {
                                    this.takeAll()
                                },
                            }]
                            : [])
                    ]
                },
                body: this.getBodyConfig(this.articlesNT, true)
            }
            : undefined;
    }

    private ceateListTreatedConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesCount = this.articlesT
            ? this.articlesT.filter((article: ArticleLivraison) => !article.is_ref && !article.currentLogisticUnitId).length
            : 0;
        const referencesCount = this.articlesT
            ? this.articlesT.filter((article: ArticleLivraison) => article.is_ref).length
            : 0;
        const logisiticUnitsCount = this.articlesT
            ? this.articlesT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
                .map((article: ArticleLivraison) => article.currentLogisticUnitId)
                .filter((id: number, index, articleIds) => index === articleIds.indexOf(id))
                .length
            : 0;
        const articlesInLogisticUnitCount = this.articlesT
            ? this.articlesT
                .filter((article: ArticleLivraison) => article.currentLogisticUnitId)
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
                title: 'Livré',
                info: `${content.join(', ')}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-yellow'
                },
            },
            body: this.getBodyConfig(this.articlesT)
        };
    }

    private createArticleInfo({label, barcode, location, quantity, targetLocationPicking}: ArticleLivraison): { [name: string]: { label: string; value: string; } } {
        return {
            label: {
                label: 'Label',
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
                location && location !== 'null'
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: location
                        }
                    }
                    : {}
            ),
            ...(
                quantity
                    ? {
                        quantity: {
                            label: 'Quantité',
                            value: `${quantity}`
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

    private updateList(articles: Array<ArticleLivraison>, isInit: boolean = false): void {
        this.articlesNT = articles.filter(({has_moved}) => (has_moved === 0));
        this.articlesT = articles.filter(({has_moved}) => (has_moved === 1));

        this.listToTreatConfig = this.createListToTreatConfig();
        this.listTreatedConfig = this.ceateListTreatedConfig();

        if (!isInit) {
            if (this.articlesNT.length === 0) {
                this.refreshOver();
            } else {
                this.refresh();
            }
            this.loadingStartLivraison = false;
        }
    }

    private getBodyConfig(articles: Array<ArticleLivraison>, notTreatedList: boolean = false) {
        const groupedArticlesByLogisticUnit = articles
            .reduce((acc, article) => {
                (acc[article['currentLogisticUnitCode']] = acc[article['currentLogisticUnitCode']] || []).push(article);
                return acc;
            }, {});

        let bodyConfig = [];
        Object.keys(groupedArticlesByLogisticUnit).map((logisticUnit?: string) => {
            const articles = groupedArticlesByLogisticUnit[logisticUnit];

            if (logisticUnit !== `null`) {
                const firstArticle = articles[0];

                this.sqliteService.findOneBy(`nature`, {id: firstArticle.currentLogisticUnitNatureId})
                    .subscribe((nature: Nature) => {
                        bodyConfig.push({
                            infos: this.createLogisticUnitInfo(articles, logisticUnit, nature.label, firstArticle.currentLogisticUnitLocation),
                            color: nature.color,
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
                                    this.testIfBarcodeEquals(article, false)
                                }
                            },
                        }) : {},
                    })
                });
            }
        });

        return bodyConfig;
    }

    private showLogisticUnitContent(articles: Array<ArticleLivraison>, logisticUnit: string): void {
        const filteredArticles = articles.filter((article: ArticleLivraison) => article.currentLogisticUnitCode === logisticUnit);
        const options = {
            articles: filteredArticles,
            logisticUnit,
        }
        this.navService.push(NavPathEnum.DELIVERY_LOGISTIC_UNIT_CONTENT, options)
    }

    private createLogisticUnitInfo(articles: Array<ArticleLivraison>, logisticUnit: string, natureLabel: string, location: string) {
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
            location: {
                label: `Emplacement`,
                value: location
            },
            nature: {
                label: `Nature`,
                value: natureLabel
            },
        }
    }
}
