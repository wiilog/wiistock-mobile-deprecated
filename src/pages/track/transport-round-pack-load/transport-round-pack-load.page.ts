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
    }>;

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
                private translationService: TranslationService) {
        super(navService);
        this.natureIdsToColors = {};
    }

    public ionViewWillEnter(): void {
        this.round = this.currentNavParams.get('round');
        this.packs = this.round.lines.reduce(
            (acc: Array<any>, line: TransportRoundLine) => [...(line.packs || []), ...acc],
            []
        );

        this.translationService.get('natures')
            .subscribe((natureTranslations: Translations) => {
                this.natureTranslations = natureTranslations;

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
        const packsToLoad = this.packs.filter(({loaded}) => (!loaded));
        const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
        const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

        const hasPackToLoad = this.packs && this.packs.some(({loaded}) => !loaded);
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
                }
            }))
        };
    }

    private refreshListLoadedConfig(): void {
        const loadedPacks = this.packs.filter(({loaded}) => loaded);
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
                )
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
            .filter(({loaded}) => !loaded)
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
        const loadedPacks = this.packs.filter(({loaded}) => loaded);
        if (loadedPacks.length > 0) {
            this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD_CONFIRM, {
                packs: this.packs.filter(({loaded}) => loaded),
            });
        } else {
            this.toastService.presentToast('Veuillez charger au moins un colis pour continuer');
        }
    }
}
