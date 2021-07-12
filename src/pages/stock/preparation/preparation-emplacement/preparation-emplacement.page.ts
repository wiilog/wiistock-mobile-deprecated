import {Component, EventEmitter, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {ToastService} from '@app/common/services/toast.service';
import {StorageService} from '@app/common/services/storage/storage.service';
import {Network} from '@ionic-native/network/ngx';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {BarcodeScannerModeEnum} from '@app/common/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@app/common/components/panel/model/icon-config';
import {Preparation} from '@entities/preparation';
import {Emplacement} from '@entities/emplacement';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {flatMap, map} from 'rxjs/operators';
import {from, Observable, of, zip} from 'rxjs';
import {PageComponent} from '@pages/page.component';
import {StorageKeyEnum} from '@app/common/services/storage/storage-key.enum';

@Component({
    selector: 'wii-preparation-emplacement',
    templateUrl: './preparation-emplacement.page.html',
    styleUrls: ['./preparation-emplacement.page.scss'],
})
export class PreparationEmplacementPage extends PageComponent {
    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public preparation: Preparation;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;

    private isLoading: boolean;

    private validatePrepa: () => void;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService,
                       navService: NavService) {
        super(navService);
        this.isLoading = false;
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.preparation = this.currentNavParams.get('preparation');
        this.validatePrepa = this.currentNavParams.get('validatePrepa');

        this.resetEmitter$.emit();

        this.panelHeaderConfig = this.createPanelHeaderConfig();

        if (this.selectItemComponent) {
            this.selectItemComponent.fireZebraScan();
        }
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location: Emplacement): void {
        this.location = location;
        this.panelHeaderConfig = this.createPanelHeaderConfig();
    }

    public validate(): void {
        if (!this.isLoading) {
            if (this.location && this.location.label) {
                this.isLoading = true;
                this.sqliteService
                    .findArticlesByPrepa(this.preparation.id)
                    .pipe(
                        flatMap((articles) => zip(
                            ...articles.map((article) => (
                                this.sqliteService
                                    .findMvtByArticlePrepa(article.id)
                                    .pipe(
                                        flatMap((mvt) => (
                                            mvt
                                                ? this.sqliteService.finishMvt(mvt.id, this.location.label)
                                                : of(undefined)
                                        ))
                                    )
                            ))
                        )),

                        flatMap(() => this.incrementStoragePreparationCounter()),
                        flatMap(() => this.sqliteService.finishPrepa(this.preparation.id, this.location.label)),
                        flatMap((): any => (
                            this.network.type !== 'none'
                                ? this.localDataManager.sendFinishedProcess('preparation')
                                : of({offline: true})
                        ))
                    )
                    .subscribe(
                        ({offline, success}: any) => {
                            if (offline) {
                                this.toastService.presentToast('Préparation sauvegardée localement, nous l\'enverrons au serveur une fois internet retrouvé');
                                this.closeScreen();
                            }
                            else {
                                this.handlePreparationsSuccess(success.length);
                            }
                        },
                        (error) => {
                            this.handlePreparationsError(error);
                        });
            }
            else {
                this.toastService.presentToast('Veuillez sélectionner ou scanner un emplacement.');
            }
        }
    }

    private handlePreparationsSuccess(nbPreparationsSucceed: number): void {
        if (nbPreparationsSucceed > 0) {
            this.toastService.presentToast(
                (nbPreparationsSucceed === 1
                    ? 'Votre préparation a bien été enregistrée'
                    : `Votre préparation et ${nbPreparationsSucceed - 1} préparation${nbPreparationsSucceed - 1 > 1 ? 's' : ''} en attente ont bien été enregistrées`)
            );
        }
        this.closeScreen();
    }

    private handlePreparationsError(resp): void {
        this.isLoading = false;
        this.toastService.presentToast((resp && resp.api && resp.message) ? resp.message : 'Une erreur s\'est produite');
        throw resp;
    }

    private closeScreen(): void {
        this.isLoading = false;
        this.navService.pop().subscribe(() => {
            this.validatePrepa();
        });
    }

    private createPanelHeaderConfig(): { title: string; subtitle?: string; leftIcon: IconConfig; rightIcon: IconConfig; transparent: boolean;} {
        return {
            title: 'Emplacement sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true,
            leftIcon: {
                name: 'preparation.svg'
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.validate()
            }
        };
    }

    public incrementStoragePreparationCounter(): Observable<void> {
        return this.storageService.getNumber(StorageKeyEnum.NB_PREPS).pipe(
            map((counter) => counter || 0),
            flatMap((counter) => this.storageService.setItem(StorageKeyEnum.NB_PREPS, `${counter + 1}`)),
            map(() => undefined)
        );
    }
}
