import {ChangeDetectorRef, Component, EventEmitter, ViewChild} from '@angular/core';
import {Emplacement} from '@entities/emplacement';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {ListPanelItemConfig} from '@app/common/components/panel/model/list-panel/list-panel-item-config';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {from, Observable, of, zip} from 'rxjs';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {AlertController} from '@ionic/angular';
import {filter, flatMap, map} from 'rxjs/operators';
import {NavService} from '@app/common/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {DemandeLivraisonArticle} from '@entities/demande-livraison-article';
import {AlertManagerService} from '@app/common/services/alert-manager.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {IconColor} from '@app/common/components/icon/icon-color';
import {PageComponent} from '@pages/page.component';
import {FreeField, FreeFieldType} from "@entities/free-field";
import {FormPanelService} from '@app/common/services/form-panel.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';


@Component({
    selector: 'wii-demande-livraison-articles',
    templateUrl: './demande-livraison-articles.page.html',
    styleUrls: ['./demande-livraison-articles.page.scss'],
})
export class DemandeLivraisonArticlesPage extends PageComponent implements CanLeave {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public listBoldValues: Array<string>;

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly scannerType: SelectItemTypeEnum = SelectItemTypeEnum.DEMANDE_LIVRAISON_ARTICLES;

    public resetSelectItemEmitter$: EventEmitter<void>;

    public loading: boolean;

    public fromStock: boolean;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<ListPanelItemConfig>;

    private selectedArticles: Array<DemandeLivraisonArticle>;

    private demandeId: number;

    private alertPresented: boolean;
    private loadingPresented: boolean;
    private isUpdate: boolean;
    private pageAlreadyInit: boolean;

    public constructor(private sqliteService: SqliteService,
                       private formPanelService: FormPanelService,
                       private storageService: StorageService,
                       private alertController: AlertController,
                       private toastService: ToastService,
                       private changeDetector: ChangeDetectorRef,
                       private loadingService: LoadingService,
                       navService: NavService) {
        super(navService);
        this.loading = false;
        this.resetSelectItemEmitter$ = new EventEmitter<void>();
        this.selectedArticles = [];
        this.listBoldValues = [
            'reference',
            'label',
            'barCode',
            'quantity',
            'location',
            'management'
        ];
    }

    public ionViewWillEnter(): void {
        this.selectItemComponent.fireZebraScan();

        this.demandeId = this.currentNavParams.get('demandeId');
        this.isUpdate = Boolean(this.currentNavParams.get('isUpdate'));

        if (!this.pageAlreadyInit) {
            this.selectedArticles = [];
            this.pageAlreadyInit = true;
            this.loading = true;
            this.sqliteService
                .findOneById('demande_livraison', this.demandeId)
                .pipe(
                    filter(Boolean),
                    flatMap((demandeLivraison: DemandeLivraison) => (
                        zip(
                            this.sqliteService.findOneById('demande_livraison_type', demandeLivraison.type_id),
                            this.sqliteService.findOneById('emplacement', demandeLivraison.location_id),
                            this.sqliteService.findArticlesInDemandeLivraison(demandeLivraison.id),
                            this.storageService.getString(StorageKeyEnum.OPERATOR),
                            this.sqliteService.findBy('free_field', [`categoryType = '${FreeFieldType.DELIVERY_REQUEST}'`])
                        )
                            .pipe((map(([type, location, articles, operator, freeFields]) => ([demandeLivraison, type, location, articles, operator, freeFields]))))
                    ))
                )
                .subscribe(([demandeLivraison, type, location, articles, operator, freeFields]: [DemandeLivraison, DemandeLivraisonType, Emplacement, Array<DemandeLivraisonArticle>, string, Array<FreeField>]) => {
                    this.loading = false;
                    this.selectedArticles = articles;
                    this.headerConfig = this.createHeaderConfig(demandeLivraison, type, location, operator, articles.length, freeFields);
                    this.bodyConfig = this.createBodyConfig(articles);
                });
        }
    }

    public ionViewWillLeave(): void {
        this.selectItemComponent.unsubscribeZebraScan();
    }

    public wiiCanLeave(): boolean {
        return !this.alertPresented && !this.loadingPresented;
    }

    public addArticleInDemande(article: DemandeLivraisonArticle) {
        const index = this.selectedArticles.findIndex(({reference}) => (reference === article.reference));
        if (index > -1) {
            this.selectedArticles[index] = article;
        }
        else {
            this.selectedArticles.push(article);
        }
        this.headerConfig.info = this.getInfoHeaderConfig(this.selectedArticles.length);
        this.bodyConfig = this.createBodyConfig(this.selectedArticles);
        this.resetSelectItemEmitter$.emit();
    }

    public selectArticleQuantity(article?: DemandeLivraisonArticle) {
        this.navService.push(NavPathEnum.DEMANDE_LIVRAISON_ARTICLE_TAKE, {
            addArticleInDemande: (articleToSelect: DemandeLivraisonArticle) => this.addArticleInDemande(articleToSelect),
            article
        });
    }

    private createHeaderConfig(demandeLivraison: DemandeLivraison,
                               type: DemandeLivraisonType,
                               location: Emplacement,
                               operator: string,
                               articlesCounter: number,
                               freeFields: Array<FreeField>): HeaderConfig {
        const freeFieldsValues = JSON.parse(demandeLivraison.free_fields);

        const subtitle = [
            `Demandeur : ${operator || ''}`,
            `Emplacement : ${location ? location.label : ''}`,
            `Type : ${type ? type.label : ''}`,
            ...freeFields
                .filter(({typeId}) => (demandeLivraison.type_id == typeId))
                .map((freeField: FreeField) => this.formPanelService.formatFreeField(freeField, freeFieldsValues[freeField.id]))
        ];

        if (demandeLivraison.comment) {
            subtitle.push(`Commentaire : ${demandeLivraison.comment}`);
        }

        return {
            title: 'Demande',
            subtitle,
            action: () => {
                this.navService.pop();
            },
            info: this.getInfoHeaderConfig(articlesCounter),
            leftIcon: {
                name: 'demande.svg',
                color: 'warning' as IconColor
            },
            rightIcon: [
                {
                    name: 'check.svg',
                    color: 'success' as IconColor,
                    action: () => {
                        this.saveSelectedArticles();
                    }
                },
                {
                    name: 'trash.svg',
                    color: 'danger' as IconColor,
                    action: () => {
                        this.presentAlertToDeleteDemande();
                    }
                }
            ]
        };
    }

    private saveSelectedArticles(): void {
        this.loadingPresented = true;
        zip(
            this.loadingService.presentLoading(),
            this.deleteSavedArticleInDemande()
        )
            .pipe(
                flatMap(([loading]: [HTMLIonLoadingElement, any]) => (
                    this.selectedArticles.length > 0
                        ? zip(
                            ...(this.selectedArticles.map(({quantity_to_pick, bar_code}) => (
                                this.sqliteService.insert('article_in_demande_livraison', {
                                    article_bar_code: bar_code,
                                    demande_id: this.demandeId,
                                    quantity_to_pick
                                })
                            )))
                        ).pipe(map(() => loading))
                        : of(loading)
                )),
                flatMap((loading: HTMLIonLoadingElement) => from(loading.dismiss()))
            )
            .subscribe(() => {
                this.loadingPresented = false;
                this.popPage();
            });
    }

    private getInfoHeaderConfig(articlesCounter: number): string {
        const sArticle = articlesCounter > 1 ? 's' : '';
        return `Non synchronisée, ${articlesCounter} article${sArticle} scanné${sArticle}`;
    }

    private presentAlertToDeleteDemande(): void {
        this.alertPresented = true;
        from(this.alertController.create({
            header: 'Confirmation',
            cssClass: AlertManagerService.CSS_CLASS_MANAGED_ALERT,
            message: 'Êtes-vous sur de vouloir supprimer cette demande de livraison ?',
            buttons: [
                {
                    text: 'Confirmer',
                    cssClass: 'alert-success',
                    handler: () => {
                        this.alertPresented = false;
                        this.deleteDemande();
                    }
                },
                {
                    text: 'Annuler',
                    cssClass: 'alert-danger',
                    role: 'cancel',
                    handler: () => {
                        this.alertPresented = false;
                        return null;
                    }
                }
            ]
        })).subscribe((alert: HTMLIonAlertElement) => {
            alert.present();
        });

    }

    private deleteDemande(): void {
        this.loadingPresented = true;
        zip(
            this.loadingService.presentLoading(),
            this.sqliteService.deleteBy('demande_livraison', [`id = ${this.demandeId}`]),
            this.deleteSavedArticleInDemande()
        )
            .pipe(
                flatMap(([loading]: [HTMLIonLoadingElement, any, any]) => from(loading.dismiss()))
            )
            .subscribe(() => {
                this.loadingPresented = false;
                this.popPage();
            });
    }

    private popPage() {
        this.navService
            .pop()
            .subscribe(() => {
                this.navService.pop();
            });
    }

    private createBodyConfig(articles: Array<DemandeLivraisonArticle>): Array<ListPanelItemConfig> {
        return articles.map((article: DemandeLivraisonArticle, index: number) => ({
            infos: {
                reference: {
                    label: 'Article',
                    value: article.reference
                },
                label: {
                    label: 'Libellé',
                    value: article.label
                },
                barCode: {
                    label: 'Code barre',
                    value: article.bar_code
                },
                quantity: {
                    label: 'Quantité',
                    value: article.quantity_to_pick ? String(article.quantity_to_pick) : '0'
                },
                ...(
                    article.location_label
                    ? {
                        location: {
                            label: 'Emplacement',
                            value: article.location_label
                        }
                    }
                : {}),
                management: {
                    label: 'Gestion',
                    value: (
                        article.type_quantity === 'reference' ? 'Par référence' :
                        article.type_quantity === 'article' ? 'Par article' :
                        article.type_quantity
                    )
                }
            },
            pressAction: () => {
                this.selectArticleQuantity(article);
            },
            rightIcon: {
                name: 'trash.svg',
                color: 'danger',
                action: () => {
                    this.removeArticleFromSelected(index);
                }
            },
        }));
    }

    private removeArticleFromSelected(index: number): void {
        this.selectedArticles.splice(index, 1);
        this.headerConfig.info = this.getInfoHeaderConfig(this.selectedArticles.length);
        this.bodyConfig = this.createBodyConfig(this.selectedArticles);
    }

    private deleteSavedArticleInDemande(): Observable<any> {
        return this.sqliteService.deleteBy('article_in_demande_livraison', [`demande_id = ${this.demandeId}`]);
    }
}
