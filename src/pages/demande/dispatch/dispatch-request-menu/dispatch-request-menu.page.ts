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
        this.fabListActivated = false

        this.dispatches = [
            {
                number: 'A-20221236545',
                trackingNumber: 'TR-456789321',
                typeLabel: 'Standard',
                locationFromLabel: 'Enlèvement 1',
                locationToLabel: 'Livraison 1',
                comment: 'Commentaire',
                emergency: '',
            } as any,
            {
                number: 'A-20221236123165',
                trackingNumber: 'TR-4567800001',
                typeLabel: 'Urgence',
                locationFromLabel: 'Enlèvement 2',
                locationToLabel: 'Livraison 2',
                comment: 'Commentaire 2',
                emergency: 'Oui',
            } as any
        ]
        this.refreshPageList(this.dispatches);

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

    public onRefreshClick(): void {
        this.fabListActivated = false;

        if (this.networkService.hasNetwork()) {
            let loader: HTMLIonLoadingElement;
            this.apiSending = true;
        } else {
            this.alertService.show({
                header: 'Synchronisation impossible',
                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                message: 'Aucune connexion à internet, synchronisation des demandes impossible.',
                buttons: [{
                    text: 'Confirmer',
                    cssClass: 'alert-success'
                }]
            });
        }
    }

    public onAddClick(): void {
        this.navService.push(NavPathEnum.DISPATCH_NEW);
    }

    private refreshPageList(dispatches: Array<Dispatch>) {
        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`).subscribe((translations) => {
            this.dispatchTranslations = translations;


            this.dispatches = dispatches;

            this.dispatchListConfig = this.dispatches.map((dispatch: Dispatch): CardListConfig => {
                return {
                    title: {
                        label: 'Numéro',
                        value: dispatch.number
                    },
                    content: [
                        {label: 'Numéro de tracking', value: dispatch.trackingNumber || ''},
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
