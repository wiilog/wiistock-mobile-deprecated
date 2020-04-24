import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {SqliteProvider} from '@providers/sqlite/sqlite';
import {Preparation} from '@app/entities/preparation';
import {ToastService} from '@app/services/toast.service';
import {Observable} from 'rxjs';
import 'rxjs/add/observable/zip';
import {StorageService} from '@app/services/storage.service';
import {LocalDataManagerService} from '@app/services/local-data-manager.service';
import {flatMap} from 'rxjs/operators';
import {Network} from '@ionic-native/network';
import {of} from 'rxjs/observable/of';
import {BarcodeScannerModeEnum} from '@helpers/components/barcode-scanner/barcode-scanner-mode.enum';
import {IconConfig} from '@helpers/components/panel/model/icon-config';
import {SelectItemComponent} from "@helpers/components/select-item/select-item.component";
import {SelectItemTypeEnum} from "@helpers/components/select-item/select-item-type.enum";


@IonicPage()
@Component({
    selector: 'page-preparation-emplacement',
    templateUrl: 'preparation-emplacement.html',
})
export class PreparationEmplacementPage {
    @ViewChild('selectItemComponent')
    public selectItemComponent: SelectItemComponent;

    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    public location: Emplacement;
    public preparation: Preparation;

    public barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        leftIcon: IconConfig;
        rightIcon: IconConfig;
        transparent: boolean;
    };

    private isLoading: boolean;

    private validatePrepa: () => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private sqliteProvider: SqliteProvider,
                       private toastService: ToastService,
                       private storageService: StorageService,
                       private network: Network,
                       private localDataManager: LocalDataManagerService) {
        this.isLoading = false;
    }

    public ionViewWillEnter(): void {
        this.preparation = this.navParams.get('preparation');
        this.validatePrepa = this.navParams.get('validatePrepa');

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

    public ionViewCanLeave(): boolean {
        return !this.selectItemComponent || !this.selectItemComponent.isScanning;
    }

    public selectLocation(location: Emplacement): void {
        this.location = location;
        this.panelHeaderConfig = this.createPanelHeaderConfig();
    }

    public validate(): void {
        if (!this.isLoading) {
            if (this.location && this.location.label) {
                this.isLoading = true;
                    this.sqliteProvider
                        .findArticlesByPrepa(this.preparation.id)
                        .pipe(
                            flatMap((articles) => Observable.zip(
                                ...articles.map((article) => (
                                    this.sqliteProvider
                                        .findMvtByArticlePrepa(article.id)
                                        .pipe(
                                            flatMap((mvt) => (
                                                mvt
                                                    ? this.sqliteProvider.finishMvt(mvt.id, this.location.label)
                                                    : of(undefined)
                                            ))
                                        )
                                ))
                            )),

                            flatMap(() => this.storageService.addPrepa()),
                            flatMap(() => this.sqliteProvider.finishPrepa(this.preparation.id, this.location.label)),
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
        this.navCtrl.pop().then(() => {
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
}
