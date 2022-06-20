import {Component, EventEmitter, ViewChild} from '@angular/core';
import {Emplacement} from "@entities/emplacement";
import {SelectItemComponent} from "@app/common/components/select-item/select-item.component";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav/nav.service";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {AlertService} from "@app/common/services/alert.service";
import {Nature} from "@entities/nature";
import {AllowedNatureLocation} from "@entities/allowed-nature-location";
import {ToastService} from "@app/common/services/toast.service";
import {ApiService} from "@app/common/services/api.service";
import {LoadingService} from "@app/common/services/loading.service";
import {zip} from 'rxjs';
import {NetworkService} from "@app/common/services/network.service";
import {TransportRound} from "@entities/transport-round";

@Component({
    selector: 'app-transport-deposit-location',
    templateUrl: './transport-deposit-location.page.html',
    styleUrls: ['./transport-deposit-location.page.scss'],
})
export class TransportDepositLocationPage extends PageComponent {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    private location: Emplacement;
    private depositedDeliveryPacks: Array<{
        code: string;
        nature_id: number;
        temperature_range: string;
        quantity: number;
    }> = [];
    private depositedCollectPacks: Array<{
        nature_id: number;
        quantity: number;
    }> = [];
    private collectedPacksLocations: Array<number>;
    private undeliveredPacksLocations: Array<number>;

    private round: TransportRound;
    private skippedMenu: boolean;
    private everythingReturned: boolean;

    public panelHeaderConfig: {
        title: string;
        subtitle?: string;
        transparent: boolean;
    };

    public resetEmitter$: EventEmitter<void>;
    public loader: HTMLIonLoadingElement;

    constructor(navService: NavService,
                private sqliteService: SqliteService,
                private alertService: AlertService,
                private toastService: ToastService,
                private apiService: ApiService,
                private loadingService: LoadingService,
                private networkService: NetworkService) {
        super(navService);
        this.resetEmitter$ = new EventEmitter<void>();
    }

    public ionViewWillEnter(): void {
        this.round = this.currentNavParams.get('round');
        this.depositedDeliveryPacks = this.currentNavParams.get('depositedDeliveryPacks') || [];
        this.depositedCollectPacks = this.currentNavParams.get('depositedCollectPacks') || [];
        this.collectedPacksLocations = this.currentNavParams.get('collectedPacksLocations') || [];
        this.undeliveredPacksLocations= this.currentNavParams.get('undeliveredPacksLocations') || [];
        this.skippedMenu = this.currentNavParams.get('skippedMenu');
        this.everythingReturned = this.currentNavParams.get('everythingReturned');
        this.resetEmitter$.emit();
        this.panelHeaderConfig = this.createPanelHeaderConfig();
    }

    public ionViewWillLeave(): void {
        if (this.selectItemComponent) {
            this.selectItemComponent.unsubscribeZebraScan();
        }
    }

    private createPanelHeaderConfig(): {title: string; subtitle?: string; transparent: boolean;} {
        return {
            title: 'Emplacement de dépose sélectionné',
            subtitle: this.location && this.location.label,
            transparent: true
        };
    }

    public selectLocation(location: Emplacement): void {
        if (this.depositedDeliveryPacks.length > 0) {
            if (this.undeliveredPacksLocations.includes(location.id)) {
                this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + location.id])
                    .subscribe((allowedNatures) => {
                        const allowedNatureIds = allowedNatures.map((allowedNature: AllowedNatureLocation) => allowedNature.nature_id);
                        const unmatchedNatures = [];
                        this.depositedDeliveryPacks.forEach((pack) => {
                            if (!allowedNatureIds.includes(pack.nature_id)) {
                                unmatchedNatures.push(pack);
                            }
                        });

                        const temperatureRanges = location.temperature_ranges
                            ? location.temperature_ranges.split(';')
                            : [];
                        const unmatchedTemperatures = [];
                        this.depositedDeliveryPacks.forEach((pack) => {
                            if ((temperatureRanges.length === 0 && pack.temperature_range || !temperatureRanges.includes(pack.temperature_range))) {
                                unmatchedTemperatures.push(pack);
                            }
                        });

                        if (allowedNatureIds.length !== 0 && unmatchedNatures.length > 0) {
                            let formattedUnmatchedNatures = unmatchedNatures
                                .map(({
                                          code,
                                          nature
                                      }) => `<li><strong>${code}</strong> de nature <strong>${nature}</strong></li>`)
                                .join(' ');
                            formattedUnmatchedNatures = `<ul>${formattedUnmatchedNatures}</ul>`
                            const plural = unmatchedNatures.length > 1;
                            const pluralNatures = allowedNatures.length > 1;
                            const locationLabel = location.label;
                            const joinAllowedNatureIds = allowedNatures
                                .map((nature: AllowedNatureLocation) => nature.nature_id)
                                .join(',');

                            this.sqliteService.findBy('nature', [`id IN (${joinAllowedNatureIds})`])
                                .subscribe((natures: Array<Nature>) => {
                                    const joinAllowedNatureLabels = natures
                                        .map((nature: Nature) => `<strong>${nature.label}</strong>`)
                                        .join(', ');
                                    this.alertService.show({
                                        header: 'Erreur',
                                        backdropDismiss: false,
                                        cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                                        message: `Le${plural ? 's' : ''} colis ${formattedUnmatchedNatures} ne peu${plural ? 'vent' : 't'} pas être déposé${plural ? 's' : ''} sur l'emplacement <strong>${locationLabel}</strong> de nature${pluralNatures ? 's' : ''} ${joinAllowedNatureLabels}.`,
                                        buttons: [
                                            {
                                                text: 'OK',
                                            },
                                        ]
                                    });
                                    this.resetEmitter$.emit();
                                });
                        } else if (unmatchedTemperatures.length > 0) {
                            let formattedUnmatchedTemperatures = unmatchedTemperatures
                                .map(({code}) => `<li><strong>${code}</strong></li>`)
                                .join(' ');
                            formattedUnmatchedTemperatures = `<ul>${formattedUnmatchedTemperatures}</ul>`
                            const plural = unmatchedNatures.length > 1;
                            const locationLabel = location.label;
                            this.alertService.show({
                                header: 'Erreur',
                                backdropDismiss: false,
                                cssClass: AlertService.CSS_CLASS_MANAGED_ALERT,
                                message: `Le${plural ? 's' : ''} colis ${formattedUnmatchedTemperatures} ne peu${plural ? 'vent' : 't'} pas être déposé${plural ? 's' : ''} sur l'emplacement <strong>${locationLabel}</strong> (température non adéquate).`,
                                buttons: [
                                    {
                                        text: 'OK'
                                    },
                                ]
                            });
                            this.resetEmitter$.emit();
                        } else {
                            this.location = location;
                            this.panelHeaderConfig = this.createPanelHeaderConfig();
                        }
                    });
            } else {
                this.toastService.presentToast(`Erreur : L'emplacement sélectionné ne fait pas partie des emplacements de retour des colis non livrés`);
            }
        } else if (this.depositedCollectPacks.length > 0) {
            if(!this.collectedPacksLocations.includes(location.id)) {
                this.toastService.presentToast(`Erreur : L'emplacement sélectionné ne fait pas partie des emplacements de dépose des objets collectés`);
            } else {
                this.location = location;
                this.panelHeaderConfig = this.createPanelHeaderConfig();
            }
        }
    }

    public validate(): void {
        if (this.networkService.hasNetwork()) {
            if (this.location) {
                const params = {
                    depositedDeliveryPacks: this.depositedDeliveryPacks,
                    depositedCollectPacks: this.depositedCollectPacks,
                    location: this.location.id,
                    round: this.round.id,
                };

                zip(
                    this.loadingService.presentLoading(),
                    this.apiService.requestApi(ApiService.DEPOSIT_TRANSPORT, {params})
                ).subscribe(([loading, response]: [HTMLIonLoadingElement, any]) => {
                    loading.dismiss();

                    if (response && response.success) {
                        const onValidate = this.currentNavParams.get('onValidate');
                        if(onValidate) {
                            onValidate();
                        }

                        this.navService.runMultiplePop( this.everythingReturned ? 3 - Number(this.skippedMenu) : 1);
                    }
                });
            } else {
                this.toastService.presentToast('Veuillez sélectionner un emplacement')
            }
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de valider la dépose des colis');
        }
    }
}
