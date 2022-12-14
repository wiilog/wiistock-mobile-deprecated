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
import {flatMap} from 'rxjs/operators';
import * as moment from 'moment';
import {Mouvement} from '@entities/mouvement';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {NetworkService} from '@app/common/services/network.service';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {StorageService} from "@app/common/services/storage/storage.service";
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {zip} from "rxjs";
import {PrisePage} from "@pages/prise-depose/prise/prise.page";
import {AlertService} from "@app/common/services/alert.service";


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
                       private alertService: AlertService,
                       navService: NavService) {
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

        this.listBoldValues = ['label', 'barCode', 'location', 'quantity', 'targetLocationPicking'];

        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        zip(
            this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_DELIVERY),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_SKIP_QUANTITIES_DELIVERY),
            this.storageService.getRight(StorageKeyEnum.PARAMETER_DISPLAY_TARGET_LOCATION_PICKING)
        ).subscribe(([articles, skipValidation, skipQuantities, displayTargetLocationPicking]) => {
            this.skipValidation = skipValidation;
            this.skipQuantities = skipQuantities;
            this.displayTargetLocationPicking = displayTargetLocationPicking;
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

    public selectArticle(article, quantity) {
        if (!this.started && this.networkService.hasNetwork()) {
            this.loadingStartLivraison = true;
            this.apiService
                .requestApi(ApiService.BEGIN_LIVRAISON, {params: {id: this.livraison.id}})
                .subscribe((resp) => {
                    if (resp.success) {
                        this.started = true;
                        this.isValid = true;
                        this.toastService.presentToast('Livraison commencée.');
                        this.registerMvt(article, quantity);
                    }
                    else {
                        this.isValid = false;
                        this.loadingStartLivraison = false;
                        this.toastService.presentToast(resp.msg);
                    }
                });
        }
        else {
            if (!this.networkService.hasNetwork()) {
                this.toastService.presentToast('Livraison commencée en mode hors ligne');
            }

            this.registerMvt(article, quantity);
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

    public registerMvt(article, quantity): void {
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
                    this.sqliteService
                        .update('article_livraison', [{values: {quantity: newArticle.quantity + articleAlready.quantity}, where: [`id = ${articleAlready.id}`]}])
                        .pipe(
                            flatMap(() => this.sqliteService.update('article_livraison', [{values: {quantity: article.quantity - newArticle.quantity}, where: [`id = ${article.id}`]}])),
                            flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                } else {
                    this.sqliteService.insert('article_livraison', newArticle).subscribe((insertId) => {
                        let mouvement: Mouvement = {
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
                        };
                        this.sqliteService
                            .update('article_livraison', [{values: {quantity: article.quantity - Number(quantity)}, where: [`id = ${article.id}`]}])
                            .pipe(
                                flatMap(() => this.sqliteService.insert('mouvement', mouvement)),
                                flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])))
                            .subscribe((articles) => {
                                this.updateList(articles);
                            });
                    });
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
                    this.sqliteService
                        .update('article_livraison', [{values: {quantity: mouvement.quantity + articleAlready.quantity}, where: [`id = ${articleAlready.id}`]}])
                        .pipe(
                            flatMap(() => this.sqliteService.deleteBy('article_livraison', [`id = ${mouvement.id_article_livraison}`])),
                            flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                } else {
                    this.sqliteService
                        .insert('mouvement', mouvement)
                        .pipe(
                            flatMap(() => this.sqliteService.moveArticleLivraison(article.id)),
                            flatMap(() => this.sqliteService.findBy('article_livraison', [`id_livraison = ${this.livraison.id}`]))
                        )
                        .subscribe((articles) => {
                            this.updateList(articles);
                        });
                }
            }
        }
    }

    public validate(): void {
        if ((this.articlesNT.length > 0) ||
            (this.articlesT.length === 0)) {
            this.toastService.presentToast('Veuillez traiter tous les articles concernés');
        } else {
            const options = {
                logisticUnits: ['thomas', 'REF191000006822']
            };
            this.apiService.requestApi(ApiService.CHECK_LOGISTIC_UNIT_CONTENT, {params: options})
                .subscribe(({articles}: any) => {
                    if(articles){
                        console.log(articles);
                        this.alertService.show({
                            message: `Cette unité logistique contient des articles non demandés. Elle ne peut pas être livrée en état.`,
                            buttons: [{
                                text: 'Faire une dépose',
                                handler: () => this.redirectToDeposeOrUlAssociation(NavPathEnum.EMPLACEMENT_SCAN, this.livraison, articles),
                            }, {
                                text: 'Faire association UL',
                                handler: () => this.redirectToDeposeOrUlAssociation(NavPathEnum.ASSOCIATION, this.livraison, articles),
                            }]
                        })
                    } else {
                        this.navService.push(NavPathEnum.LIVRAISON_EMPLACEMENT, {
                            livraison: this.livraison,
                            validateLivraison: () => {
                                this.navService.pop();
                            }
                        });
                    }
                });
        }
    }

    public redirectToDeposeOrUlAssociation(redirectionRoute: NavPathEnum,
                                           livraisonToRedirect: Livraison,
                                           articles: Array<{barcode: string; reference: string; label: string; quantity: number; location: string; currentLogisticUnitCode: string}>): void {
        let $articlesList = [];
        console.log(articles);
        const date = moment().format();
        if (redirectionRoute === 'emplacement-scan'){
            $articlesList = articles.map((article) => ({
                ref_article: article.reference,
                type: PrisePage.MOUVEMENT_TRACA_PRISE,
                finished: 0,
                quantity: article.quantity,
                date,
            }));
        } else if(redirectionRoute === 'association') {
            $articlesList = articles.map((article) => ({
                barCode: article.barcode,
                label: article.label,
                quantity: article.quantity,
                location: article.location,
                reference: article.reference,
                ref_article: article.reference,
                // currentLogisticUnitCode: article.currentLogisticUnitCode,
                is_lu: false,
                date
            }));
        }
        console.log($articlesList);
        this.navService.pop().subscribe(() => {
            this.navService.push(redirectionRoute, {
                articlesList: $articlesList,
                livraisonToRedirect,
                fromStock: true,
                fromStockLivraison: true,
                goToDepose: true,
            });
        });
    }

    public testIfBarcodeEquals(text, fromText: boolean = true): void {
        const article = fromText
            ? this.articlesNT.find((article) => (article.barcode === text))
            : text;

        if (article) {
            const self = this;
            if (this.skipQuantities) {
                self.selectArticle(article, article.quantity);
            } else {
                this.navService.push(NavPathEnum.LIVRAISON_ARTICLE_TAKE, {
                    article,
                    selectArticle: (quantity) => {
                        self.selectArticle(article, quantity);
                    }
                });
            }

        }
        else {
            this.toastService.presentToast('L\'article scanné n\'est pas dans la liste.');
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
                    this.articlesNT.forEach((article) => this.selectArticle(article, article.quantity));
                }
                else {
                    this.isValid = false;
                    this.loadingStartLivraison = false;
                    this.toastService.presentToast(resp.msg);
                }
            });
    }

    private createListToTreatConfig(): { header: HeaderConfig; body: Array<ListPanelItemConfig>; } {
        const articlesNumber = (this.articlesNT ? this.articlesNT.length : 0);
        const articlesPlural = articlesNumber > 1 ? 's' : '';
        return articlesNumber > 0
            ? {
                header: {
                    title: 'À livrer',
                    info: `${articlesNumber} article${articlesPlural} à scanner`,
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
                body: this.articlesNT.map((articleLivraison: ArticleLivraison) => ({
                    infos: this.createArticleInfo(articleLivraison),
                    rightIcon: {
                        color: 'grey' as IconColor,
                        name: 'up.svg',
                        action: () => {
                            this.testIfBarcodeEquals(articleLivraison, false)
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
                title: 'Livré',
                info: `${pickedArticlesNumber} article${pickedArticlesPlural} scanné${pickedArticlesPlural}`,
                leftIcon: {
                    name: 'upload.svg',
                    color: 'list-yellow'
                },
            },
            body: this.articlesT.map((articleLivraison: ArticleLivraison) => ({
                infos: this.createArticleInfo(articleLivraison)
            }))
        };
    }

    private createArticleInfo({label, barcode, location, quantity, targetLocationPicking}: ArticleLivraison): {[name: string]: { label: string; value: string; }} {
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
            }
            else {
                this.refresh();
            }
            this.loadingStartLivraison = false;
        }
    }
}
