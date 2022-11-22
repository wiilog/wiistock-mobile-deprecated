import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {ApiService} from '@app/common/services/api.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {LoadingService} from '@app/common/services/loading.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {TrackingListFactoryService} from '@app/common/services/tracking-list-factory.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {ActivatedRoute} from '@angular/router';
import {NavService} from '@app/common/services/nav/nav.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {PageComponent} from '@pages/page.component';
import {TranslationService} from '@app/common/services/translations.service';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';
import {from, Observable} from 'rxjs';
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {IconConfig} from "@app/common/components/panel/model/icon-config";
import {flatMap, map, tap} from "rxjs/operators";
import {TransferOrderArticle} from "@entities/transfer-order-article";


@Component({
    selector: 'wii-prise',
    templateUrl: './association.page.html',
    styleUrls: ['./association.page.scss'],
})
export class AssociationPage extends PageComponent implements CanLeave {

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_MANUAL;
    public loading: boolean = false;
    public barcodeCheckLoading: boolean = false;
    public listBoldValues?: Array<string>;
    public listBody: Array<ListPanelItemConfig>;
    public articlesList: Array<{
        barCode: string,
        label: string,
        quantity: number,
        location: string|null,
        reference: string,
        currentLogisticUnitCode: string|null,
        articles: Array<string>,
        project: string|null,
        is_lu: boolean
    }>;
    public headerConfig?: {
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        title: string;
        subtitle?: Array<string>;
        info?: string;
    };

    public constructor(private networkService: NetworkService,
                       private apiService: ApiService,
                       private sqliteService: SqliteService,
                       private alertService: AlertService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private changeDetectorRef: ChangeDetectorRef,
                       private localDataManager: LocalDataManagerService,
                       private trackingListFactory: TrackingListFactoryService,
                       private activatedRoute: ActivatedRoute,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.articlesList = [];
        this.listBoldValues = ['barCode', 'label', 'location', 'quantity'];
        this.refreshHeader();
    }

    public ionViewWillLeave(): void {
        this.footerScannerComponent.unsubscribeZebraScan();
    }

    wiiCanLeave(): boolean | Observable<boolean> {
        return true;
    }

    public validate() {
        if (this.articlesList.length === 0) {
            this.toastService.presentToast('Veuillez flasher au moins un article et une unité logistique');
        } else if (!this.articlesList.some((article) => article.is_lu)) {
            this.toastService.presentToast('Vous devez flasher une unité logistique pour valider');
        } else if (this.articlesList.length === 1) {
            this.toastService.presentToast('Vous devez flasher au moins un article pour valider');
        } else {
            this.finish();
        }
    }

    public finish() {
        const articlesWithLogisticUnits = this.articlesList.filter((article) => article.currentLogisticUnitCode);
        const logisticUnit = this.articlesList.filter((article) => article.is_lu)[0];
        const articlesToDrop = this.articlesList.filter((article) => !article.is_lu);
        const needsLocationPicking = !logisticUnit.location;

        console.log('Articles to verify :', articlesWithLogisticUnits.map((article) => article.barCode));
        console.log('Articles to send', articlesToDrop.map((article) => article.barCode));
        console.log('LU to drop in', logisticUnit.barCode);
        console.log('Need location select', needsLocationPicking);

        if (this.networkService.hasNetwork()) {
            this.barcodeCheckLoading = true;
            let loader: HTMLIonLoadingElement;
            this.loadingService
                .presentLoading('Vérification...')
                .pipe(
                    tap((presentedLoader) => {
                        loader = presentedLoader;
                    }),
                    flatMap(() => this.apiService
                        .requestApi(ApiService.DROP_IN_LU, {
                            params: {
                                articles: articlesToDrop.map((article) => article.barCode),
                                lu: logisticUnit.barCode
                            }
                        })),
                    flatMap((res) => from(loader.dismiss()).pipe(
                        tap(() => {
                            loader = undefined;
                        }),
                        map(() => (res))
                    ))
                )
                .subscribe(
                    (res) => {
                        console.log(res);
                        this.toastService.presentToast('Association UL - Articles effectuée.')
                            .toPromise()
                            .then((_: void) => this.navService.pop());
                    },
                    () => {
                        if (loader) {
                            loader.dismiss();
                        }
                        this.barcodeCheckLoading = false;
                        this.toastService.presentToast('Erreur serveur');
                    }
                );
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public scan(barCode: string) {
        console.log(barCode);
        if (this.networkService.hasNetwork()) {
            this.barcodeCheckLoading = true;
            let loader: HTMLIonLoadingElement;
            this.loadingService
                .presentLoading('Vérification...')
                .pipe(
                    tap((presentedLoader) => {
                        loader = presentedLoader;
                    }),
                    flatMap(() => this.apiService
                        .requestApi(ApiService.GET_ARTICLES, {
                            params: {
                                barCode,
                                createIfNotExist: true
                            }
                        })),
                    flatMap((res) => from(loader.dismiss()).pipe(
                        tap(() => {
                            loader = undefined;
                        }),
                        map(() => (res))
                    ))
                )
                .subscribe(
                    (res) => {
                        console.log(res);
                        const article = (
                            res
                            && res.success
                            && res.article
                        );
                        console.log(article);
                        const existing = this.articlesList.some((articleElement) => articleElement.barCode === article.barCode);
                        if (existing) {
                            this.toastService.presentToast('Vous avez déjà scanné cet article ou cette unité logistique.');
                        } else if (article && (!article.is_lu || this.articlesList.every((articleElement) => !articleElement.is_lu))) {
                            if (article.is_ref) {
                                this.toastService.presentToast('Vous ne pouvez pas scanner une référence.');
                            } else {
                                this.articlesList.push(article);
                                this.refreshList();
                                this.refreshHeader();
                            }
                        } else {
                            this.toastService.presentToast('Vous avez déjà scanné une unité logistique.');
                        }
                    },
                    () => {
                        if (loader) {
                            loader.dismiss();
                        }
                        this.barcodeCheckLoading = false;
                        this.toastService.presentToast('Erreur serveur');
                    }
                );
        }
        else {
            this.toastService.presentToast('Vous devez être connecté à internet pour effectuer une prise');
        }
    }

    public refreshHeader() {
        this.headerConfig = {
            leftIcon: {
                name: 'transfer.svg',
                color: 'tertiary'
            },
            rightIcon: {
                color: 'primary',
                name: 'scan-photo.svg',
                action: () => {
                    this.footerScannerComponent.scan();
                }
            },
            title: `Scanner article(s) et Unité logistique`,
            subtitle: [
                `${this.articlesList.filter((article) => !article.is_lu).length} article(s) scanné(s) et ${this.articlesList.some((article) => article.is_lu)  ? '1' : '0'} UL scannée`,
            ]
        };
    }

    public refreshList() {
        this.listBody = this.articlesList.map((article) => ({
            infos: this.createArticleInfo(article),
            rightIcon: {
                name: 'trash.svg',
                color: 'danger',
                action: () => {
                    this.removeArticle(article);
                }
            }
        }))
    }

    public removeArticle(article) {
        this.articlesList.splice(this.articlesList.indexOf(article), 1);
        this.refreshList();
        this.refreshHeader();
    }

    public createArticleInfo(articleOrPack): {[name: string]: { label: string; value: string; }} {
        return {
            label: {
                label: articleOrPack.is_lu ? 'Projet' : 'Libellé',
                value: articleOrPack.is_lu ? articleOrPack.project : articleOrPack.label
            },
            barCode: {
                label: 'Code barre',
                value: articleOrPack.barCode
            },
            location: {
                label: 'Emplacement',
                value: articleOrPack.location
            },
            quantity: {
                label: articleOrPack.is_lu ? 'Nombre d\'article(s)' : 'Quantité',
                value: articleOrPack.is_lu ? (articleOrPack.articles ? articleOrPack.articles.length : 0) : articleOrPack.quantity,
            }
        };
    }

}
