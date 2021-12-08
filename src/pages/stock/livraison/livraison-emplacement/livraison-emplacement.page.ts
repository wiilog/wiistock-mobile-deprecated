import {Component, EventEmitter, ViewChild} from '@angular/core';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {Emplacement} from '@entities/emplacement';
import {Livraison} from '@entities/livraison';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {ToastService} from '@app/common/services/toast.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {of, zip} from 'rxjs';
import {flatMap, map} from 'rxjs/operators';
import {PageComponent} from '@pages/page.component';
import * as moment from 'moment';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';
import {StorageService} from '@app/common/services/storage/storage.service';
import {LoadingService} from "@app/common/services/loading.service";
import {NetworkService} from '@app/common/services/network.service';

@Component({
    selector: 'wii-livraison-emplacement',
    templateUrl: './livraison-emplacement.page.html',
    styleUrls: ['./livraison-emplacement.page.scss'],
})
export class LivraisonEmplacementPage extends PageComponent {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public livraison: Livraison;

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SEARCH_SCAN;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    private validateIsLoading: boolean;
    private validateLivraison: () => void;

    public skipValidation: boolean = false;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private networkService: NetworkService,
                       private localDataManager: LocalDataManagerService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.validateIsLoading = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.storageService.getBoolean(StorageKeyEnum.PARAMETER_SKIP_VALIDATION_DELIVERY).subscribe((skipValidation) => {
            this.skipValidation = skipValidation;
            this.validateLivraison = this.currentNavParams.get('validateLivraison');
            this.livraison = this.currentNavParams.get('livraison');

            this.resetEmitter$.emit();

            this.panelHeaderConfig = this.createPanelHeaderConfig();

            if (this.selectItemComponent) {
                this.selectItemComponent.fireZebraScan();
            }
        });
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(locationToTest: Emplacement): void {
        if (this.livraison.location === locationToTest.label) {
            this.location = locationToTest;
            this.panelHeaderConfig = this.createPanelHeaderConfig();
            if (this.skipValidation) {
                this.validate();
            }
        }
        else {
            this.toastService.presentToast("Vous n'avez pas scanné le bon emplacement (destination demandée : " + this.livraison.location + ")")
        }
    }

    public validate(): void {
        if (!this.validateIsLoading) {
            if (this.location && this.location.label) {
                this.loadingService.presentLoadingWhile(
                    {
                        message: 'Envoi de la livraison en cours...',
                        event: () => {
                            this.validateIsLoading = true;
                            return this.sqliteService
                                .findBy('article_livraison', [`id_livraison = ${this.livraison.id}`])
                                .pipe(
                                    flatMap((articles) => zip(
                                        ...articles.map((article) => (
                                            this.sqliteService
                                                .findMvtByArticleLivraison(article.id)
                                                .pipe(flatMap((mvt) => this.sqliteService.finishMvt(mvt.id, this.location.label)))
                                        ))
                                    )),
                                    flatMap(() => this.sqliteService.update(
                                        'livraison',
                                        [{
                                            values: {
                                                date_end: moment().format(),
                                                location: this.location.label
                                            },
                                            where: [`id = ${this.livraison.id}`]
                                        }]
                                    )),
                                    flatMap((): any => (
                                        this.networkService.hasNetwork()
                                            ? this.localDataManager.sendFinishedProcess('livraison')
                                            : of({offline: true})
                                    )),
                                    flatMap((res: any) => (
                                        res.offline || res.success.length > 0
                                            ? this.storageService.incrementCounter(StorageKeyEnum.COUNTERS_DELIVERIES_TREATED).pipe(map(() => res))
                                            : of(res)
                                    )),
                                );
                        }
                    }
                ).subscribe(
                    ({offline, success}: any) => {
                        if (offline) {
                            this.toastService.presentToast('Livraison sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                            this.closeScreen();
                        } else {
                            this.handleLivraisonSuccess(success.length);
                        }
                    },
                    (error) => {
                        this.handleLivraisonError(error);
                    });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
        else {
            this.toastService.presentToast('Chargement en cours...');
        }
    }

    private handleLivraisonSuccess(nbLivraisonsSucceed: number): void {
        if (nbLivraisonsSucceed > 0) {
            this.toastService.presentToast(
                (nbLivraisonsSucceed === 1
                    ? 'Votre livraison a bien été enregistrée'
                    : `Votre livraison et ${nbLivraisonsSucceed - 1} livraison${nbLivraisonsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handleLivraisonError(resp): void {
        this.validateIsLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        if (resp.api) {
            throw resp;
        }
    }

    private closeScreen(): void {
        this.validateIsLoading = false;
        this.navService.pop().subscribe(() => {
            this.validateLivraison();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'delivery.svg'
            }
        };
    }
}
