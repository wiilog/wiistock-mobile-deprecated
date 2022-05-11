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
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {NetworkService} from "@app/common/services/network.service";

@Component({
    selector: 'app-transport-round-pack-load-validate',
    templateUrl: './transport-round-pack-load-validate.page.html',
    styleUrls: ['./transport-round-pack-load-validate.page.scss'],
})
export class TransportRoundPackLoadValidatePage extends PageComponent {

    @ViewChild('selectItemComponent', {static: false})
    public selectItemComponent: SelectItemComponent;

    public readonly barcodeScannerSearchMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.TOOL_SEARCH;
    public readonly selectItemType = SelectItemTypeEnum.LOCATION;

    private location: Emplacement;
    private packs: Array<{
        code: string;
        nature_id: number;
        temperature_range: string;
    }>;
    private round: any;

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
        this.packs = this.currentNavParams.get('packs');
        this.round = this.currentNavParams.get('round');
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
        this.sqliteService.findBy('allowed_nature_location', ['location_id = ' + location.id])
            .subscribe((allowedNatures) => {
                const allowedNatureIds = allowedNatures.map((allowedNature: AllowedNatureLocation) => allowedNature.nature_id);
                const unmatchedNatures = [];
                this.packs.forEach((pack) => {
                    if (!allowedNatureIds.includes(pack.nature_id)) {
                        unmatchedNatures.push(pack);
                    }
                });

                const temperatureRanges = location.temperature_ranges
                    ? location.temperature_ranges.split(';')
                    : [];
                const unmatchedTemperatures = [];
                this.packs.forEach((pack) => {
                    if (pack.temperature_range && !temperatureRanges.includes(pack.temperature_range)) {
                        unmatchedTemperatures.push(pack);
                    }
                });

                if (allowedNatureIds.length !== 0 && unmatchedNatures.length > 0) {
                    let formattedUnmatchedNatures = unmatchedNatures
                        .map(({code, nature}) => `<li><strong>${code}</strong> de nature <strong>${nature}</strong></li>`)
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
                                        text: 'Ok',
                                        cssClass: 'alert-danger',
                                        role: 'cancel'
                                    },
                                ]
                            });
                            this.resetEmitter$.emit();
                        });
                } else if (temperatureRanges.length === 0 || unmatchedTemperatures.length > 0) {
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
                                text: 'Ok',
                                cssClass: 'alert-danger',
                                role: 'cancel'
                            },
                        ]
                    });
                    this.resetEmitter$.emit();
                } else {
                    this.location = location;
                    this.panelHeaderConfig = this.createPanelHeaderConfig();
                }
            });
    }

    public validate(): void {
        if (this.networkService.hasNetwork()) {
            if (this.location) {
                const options = {
                    params: {
                        packs: this.packs.map(({code}) => code),
                        location: this.location.id,
                    }
                }
                zip(
                    this.loadingService.presentLoading(),
                    this.apiService.requestApi(ApiService.LOAD_PACKS, options)
                ).subscribe(([loading, response]: [HTMLIonLoadingElement, any]) => {
                    loading.dismiss();
                    if (response && response.success) {
                        this.toastService.presentToast('Les colis ont bien été chargés');
                        this.navService.push(NavPathEnum.TRANSPORT_ROUND_LIST);
                    }
                });
            } else {
                this.toastService.presentToast('Veuillez sélectionner un emplacement')
            }
        } else {
            this.toastService.presentToast('Veuillez vous connecter à internet afin de valider le chargement des colis');
        }
    }
}
