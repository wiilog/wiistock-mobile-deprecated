import {Component, ViewChild} from '@angular/core';
import {NavService} from "@app/common/services/nav/nav.service";
import {TransportRound} from "@entities/transport-round";
import {PageComponent} from "@pages/page.component";
import {TranslationService} from "@app/common/services/translations.service";
import {IconColor} from "@app/common/components/icon/icon-color";
import {CardListColorEnum} from "@app/common/components/card-list/card-list-color.enum";
import {TransportRoundLine} from "@entities/transport-round-line";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ToastService} from "@app/common/services/toast.service";
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {Translations} from "@entities/translation";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {NavPathEnum} from "@app/common/services/nav/nav-path.enum";
import {AlertService} from "@app/common/services/alert.service";
import {ApiService} from "@app/common/services/api.service";
import {zip} from 'rxjs';
import {LoadingService} from "@app/common/services/loading.service";

@Component({
    selector: 'app-transport-round-pack-load',
    templateUrl: './transport-round-pack-load.page.html',
    styleUrls: ['./transport-round-pack-load.page.scss'],
})
export class TransportRoundPackLoadPage extends PageComponent {

    public readonly listBoldValues = ['code', 'nature', 'temperature_range'];
    public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

    private natureTranslations: Translations;
    private round: TransportRound;
    private packs: Array<{
        code: string;
        nature: string;
        nature_id: number;
        loaded: number;
        rejected: boolean;
    }>;
    private packRejectMotives: Array<string>;

    public packsToLoadListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    public packsLoadedListConfig: {
        header: HeaderConfig;
        body: Array<ListPanelItemConfig>;
    };

    private natureIdsToColors: {[natureId: number]: string};

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    constructor(navService: NavService,
                private toastService: ToastService,
                private sqliteService: SqliteService,
                private translationService: TranslationService,
                private alertService: AlertService,
                private apiService: ApiService,
                private loadingService: LoadingService) {
        super(navService);
        this.natureIdsToColors = {};
    }

    public ionViewWillEnter(): void {
        this.round = this.currentNavParams.get('round');
        this.packs = this.round.lines.reduce(
            (acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc],
            []
        );

        zip(
            this.loadingService.presentLoading('Récupération des données en cours'),
            this.apiService.requestApi(ApiService.GET_REJECT_MOTIVES),
            this.translationService.get('natures')
        )
            .subscribe(([loading, {pack}, natureTranslations] : [HTMLIonLoadingElement, any, Translations]) => {
                this.packRejectMotives = pack;
                this.natureTranslations = natureTranslations;
                loading.dismiss();

                this.refreshListLoadedConfig();
                this.refreshListToLoadConfig();
            });
    }

    public ionViewWillLeave(): void {
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    private refreshListToLoadConfig(): void {
        const packsToLoad = this.packs.filter(({loaded, rejected}) => (!loaded && !rejected));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const hasPackToLoad = this.packs && this.packs.some(({loaded, rejected}) => !loaded && !rejected);
        this.packsToLoadListConfig = {
            header: {
                title: 'Colis à charger',
                info: `${packsToLoad.length} colis`,
                leftIcon: {
                    name: 'packs-to-load.svg',
                    color: 'list-green-light'
                },
                rightIconLayout: 'horizontal',
                ...(hasPackToLoad
                    ? {
                        rightIcon: [
                            {
                                color: 'primary',
                                name: 'scan-photo.svg',
                                action: () => {
                                    this.footerScannerComponent.scan();
                                }
                            },
                            {
                                name: 'up.svg',
                                action: () => this.loadAll()
                            }
                        ]
                    }
                    : {})
            },
            body: packsToLoad.map((pack) => ({
                ...(TransportRoundPackLoadPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                rightIcon: {
                    color: 'grey' as IconColor,
                    name: 'up.svg',
                    action: () => this.loadPack(pack.code)
                },
                sliding: true,
                slidingConfig: {
                    left: [{
                        label: 'Ecarter',
                        color: '#f53d3d',
                        action: () => this.dismiss(pack)
                    }]
                }
            }))
        };
    }

    private refreshListLoadedConfig(): void {
        const loadedPacks = this.packs.filter(({loaded, rejected}) => loaded && !rejected);
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const plural = loadedPacks.length > 1 ? 's' : '';
        this.packsLoadedListConfig = {
            header: {
                title: 'Colis scannés',
                info: `${loadedPacks.length} colis scanné${plural}`,
                leftIcon: {
                    name: 'loaded-packs.svg',
                    color: CardListColorEnum.GREEN
                }
            },
            body: loadedPacks.map((pack) => ({
                ...(TransportRoundPackLoadPage.packToListItemConfig(pack, natureTranslationCapitalized)),
                ...({
                        pressAction: () => {},
                        rightIcon: {
                            name: 'trash.svg',
                            color: 'danger',
                            action: () => this.revertPack(pack.code)
                        }
                    }
                ),
                sliding: true,
                slidingConfig: {
                    left: [{
                        label: 'Ecarter',
                        color: '#f53d3d',
                        action: () => this.dismiss(pack)
                    }]
                },
            }))
        };
    }

    public loadPack(barCode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1) {
            const selectedItem = this.packs[selectedIndex];
            if (selectedItem.loaded) {
                this.toastService.presentToast(`Vous avez déjà traité ce colis`);
            }
            else {
                this.packs.splice(selectedIndex, 1);
                this.packs.unshift(selectedItem);
                selectedItem.loaded = 1;
                this.refreshListToLoadConfig();
                this.refreshListLoadedConfig();
            }
        }
        else {
            this.toastService.presentToast(`Le colis scanné n'existe pas dans la liste`);
        }
    }

    private loadAll(): void {
        this.packs
            .filter(({loaded, rejected}) => !loaded && !rejected)
            .forEach(({code}) => {
                this.loadPack(code);
            });
    }

    private revertPack(barCode: string): void {
        const selectedIndex = this.packs.findIndex(({code}) => (code === barCode));
        if (selectedIndex > -1
            && this.packs[selectedIndex].loaded) {
            this.packs[selectedIndex].loaded = 0;

            this.refreshListToLoadConfig();
            this.refreshListLoadedConfig();
        }
    }

    private static packToListItemConfig({code, nature, color, temperature_range}: any, natureTranslation: string): any {
        return {
            infos: {
                code: {
                    label: 'Colis',
                    value: code
                },
                nature: {
                    label: natureTranslation,
                    value: nature
                },
                temperature_range: {
                    label: 'Température',
                    value: temperature_range
                }
            },
            color: color
        }
    }

    public validate(): void {
        const loadedPacks = this.packs.filter(({loaded, rejected}) => loaded && !rejected);
        if (loadedPacks.length > 0) {
            this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD_VALIDATE, {
                packs: this.packs.filter(({loaded, rejected}) => loaded && !rejected),
                round: this.round
            });
        } else {
            this.toastService.presentToast('Veuillez charger au moins un colis pour continuer');
        }
    }

    public dismiss(pack): void {
        if (this.packRejectMotives.length > 0) {
            const formattedRejectMotives = this.packRejectMotives.reduce((acc: Array<any>, rejectMotive: string) => {
                acc.push({
                    label: rejectMotive,
                    name: rejectMotive,
                    value: rejectMotive,
                    type: 'radio',
                });
                return acc;
            }, []);

            this.alertService.show({
                header: `Ecarter le colis ${pack.code}`,
                inputs: formattedRejectMotives,
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel'
                    },
                    {
                        text: 'Valider',
                        handler: (rejectMotive) => {
                            if(rejectMotive) {
                                const options = {
                                    params: {
                                        pack: pack.code,
                                        rejectMotive: rejectMotive
                                    }
                                };
                                zip(
                                    this.loadingService.presentLoading(),
                                    this.apiService.requestApi(ApiService.REJECT_PACK, options),
                                )
                                    .subscribe(([loading, response]: [HTMLIonLoadingElement, any]) => {
                                        if(response && response.success) {
                                            const selectedIndex = this.packs.findIndex(({code}) => (code === pack.code));
                                            this.packs[selectedIndex].rejected = true;
                                            this.refreshListLoadedConfig();
                                            this.refreshListToLoadConfig();
                                            loading.dismiss();
                                        }
                                    });
                            } else {
                                this.toastService.presentToast(`Veuillez renseigner un motif d'écartement`)
                                return false;
                            }
                        }
                    }
                ]
            }, null, false);
        } else {
            this.toastService.presentToast(`Aucun motif d'écartement n'a été paramétré`)
        }
    }
}
