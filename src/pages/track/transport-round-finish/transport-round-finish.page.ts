import {Component, ViewChild} from '@angular/core';
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav/nav.service";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {Emplacement} from "@entities/emplacement";
import {ToastService} from "@app/common/services/toast.service";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {LoadingService} from "@app/common/services/loading.service";
import {ApiService} from "@app/common/services/api.service";
import {TransportRound} from "@entities/transport-round";

@Component({
	selector: 'wii-transport-round-finish',
	templateUrl: './transport-round-finish.page.html',
	styleUrls: ['./transport-round-finish.page.scss'],
})

export class TransportRoundFinishPage extends PageComponent {

    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.ONLY_SCAN;

    private endRoundLocations: Array<number>;
    private round: TransportRound;
    private packsDropLocation: Emplacement;
    private hasPacksToDrop: boolean;
    private packs: Array<{
        code: string;
        dropped: boolean;
        nature_id: number;
        temperature_range: string;
    }>;

    public panelHeaderConfig: {
        title: string;
        transparent: boolean;
    };

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    constructor(private sqliteService: SqliteService,
                private loadingService: LoadingService,
                private toastService: ToastService,
                private apiService: ApiService,
                navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter() {
        this.endRoundLocations = this.currentNavParams.get('endRoundLocations');
        this.hasPacksToDrop = this.currentNavParams.get('hasPacksToDrop');
        this.packsDropLocation = this.currentNavParams.get('packsDropLocation');
        this.packs = this.currentNavParams.get('packs');
        this.round = this.currentNavParams.get('round');
        this.panelHeaderConfig = {
            title: `Flasher l'emplacement de fin de tournée`,
            transparent: true
        };
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public selectLocation(location): void {
        this.loadingService.presentLoadingWhile({
            event: () => this.sqliteService.findOneBy(`emplacement`, {label: location})
        }).subscribe((location: Emplacement|null) => {
            if(this.endRoundLocations.includes(location.id)) {
                const options = {
                    params: {
                        round: this.round.id,
                        location: location.id,
                        ...this.packs && this.packsDropLocation
                            ? {
                                packs: this.packs.map(({code}) => code),
                                packsDropLocation: this.packsDropLocation.id
                            }
                            : {},
                    }
                };
                this.loadingService.presentLoadingWhile({
                    message: `Finalisation de la tournée`,
                    event: () => this.apiService.requestApi(ApiService.FINISH_ROUND, options)
                }).subscribe(({success}) => {
                    if(success) {
                        this.toastService.presentToast(`La tournée a bien été finalisée.`)
                        this.navService.runMultiplePop(this.hasPacksToDrop ? 3 : 1);
                    } else {
                        this.toastService.presentToast('Une erreur est survenue')
                    }
                });
            } else {
                this.toastService.presentToast(`L'emplacement scanné ne fait pas partie des emplacements de fin de tournée.`)
            }
        });
    }
}
