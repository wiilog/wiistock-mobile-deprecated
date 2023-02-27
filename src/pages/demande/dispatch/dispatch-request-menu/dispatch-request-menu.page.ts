import {Component} from '@angular/core';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {CardListConfig} from '@app/common/components/card-list/card-list-config';
import {StorageService} from '@app/common/services/storage/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {NavService} from '@app/common/services/nav/nav.service';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {ToastService} from '@app/common/services/toast.service';
import {CanLeave} from '@app/guards/can-leave/can-leave';
import {LoadingService} from '@app/common/services/loading.service';
import {PageComponent} from '@pages/page.component';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {AlertService} from '@app/common/services/alert.service';
import {NetworkService} from '@app/common/services/network.service';
import {Dispatch} from "@entities/dispatch";
import {TranslationService} from "@app/common/services/translations.service";
import {Translations} from "@entities/translation";
import {zip} from "rxjs";


@Component({
    selector: 'wii-dispatch-request-menu',
    templateUrl: './dispatch-request-menu.page.html',
    styleUrls: ['./dispatch-request-menu.page.scss'],
})
export class DispatchRequestMenuPage extends PageComponent implements CanLeave {
    public hasLoaded: boolean;

    public readonly dispatchListColor = CardListColorEnum.BLUE;
    public readonly dispatchIconName = 'transfer.svg';

    public dispatchListConfig: Array<CardListConfig>;
    public dispatches: Array<Dispatch>;

    public fabListActivated: boolean;

    private apiSending: boolean;
    private dispatchTranslations: Translations;

    public constructor(private sqliteService: SqliteService,
                       private networkService: NetworkService,
                       private alertService: AlertService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManager: LocalDataManagerService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private storageService: StorageService,
                       private translationService: TranslationService,
                       navService: NavService) {
        super(navService);
        this.hasLoaded = false;
        this.fabListActivated = false
        this.apiSending = false;
    }

    public ionViewWillEnter(): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.sqliteService.findBy(`dispatch`, [`draft = 1`])
        }).subscribe((dispatches) => {
            this.dispatches = dispatches;
            this.fabListActivated = false
            this.refreshPageList(this.dispatches);
        });
    }

    public wiiCanLeave(): boolean {
        return !this.apiSending;
    }

    public refreshSubTitle(): void {
        const length = (this.dispatches || []).length;
        this.mainHeaderService.emitSubTitle(`${length === 0 ? 'Aucune' : length} demande${length > 1 ? 's' : ''}`)
    }

    public onMenuClick(): void {
        this.fabListActivated = !this.fabListActivated;
    }

    public onAddClick(): void {
        this.navService.push(NavPathEnum.DISPATCH_NEW);
    }

    private refreshPageList(dispatches: Array<Dispatch>) {
        zip(
            this.translationService.getRaw(`Demande`, `Acheminements`, `Champs fixes`),
            this.translationService.getRaw(`Demande`, `Acheminements`, `Général`)
        ).subscribe(([fieldsTranslations, generalTranslations]) => {

            const fullTranslations = fieldsTranslations.concat(generalTranslations);
            this.dispatchTranslations = TranslationService.CreateTranslationDictionaryFromArray(fullTranslations);
            this.dispatches = dispatches;

            this.dispatchListConfig = this.dispatches.map((dispatch: Dispatch): CardListConfig => {
                return {
                    title: {
                        label: 'Numéro',
                        value: dispatch.number
                    },
                    action: () => {
                        this.navService.push(NavPathEnum.DISPATCH_PACKS, {
                            dispatchId: dispatch.id,
                            fromCreate: true,
                        });
                    },
                    content: [
                        {label: TranslationService.Translate(this.dispatchTranslations, 'N° tracking transporteur'), value: dispatch.carrierTrackingNumber || ''},
                        {label: 'Type', value: dispatch.typeLabel || ''},
                        {
                            label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise'),
                            value: dispatch.locationFromLabel || ''
                        },
                        {
                            label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose'),
                            value: dispatch.locationToLabel || ''
                        },
                        {label: 'Commentaire', value: dispatch.comment || ''},
                        (dispatch.emergency
                            ? {label: 'Urgence', value: dispatch.emergency || ''}
                            : undefined)
                    ].filter((item) => item && item.value),
                    ...(dispatch.emergency
                        ? {
                            rightIcon: {
                                name: 'exclamation-triangle.svg',
                                color: 'danger'
                            }
                        }
                        : {}),
                };
            });

            this.refreshSubTitle();
            this.hasLoaded = true;
        })
    }
}
