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
	selector: 'wii-transport-round-finish-pack-drop',
	templateUrl: './transport-round-finish-pack-drop.page.html',
	styleUrls: ['./transport-round-finish-pack-drop.page.scss'],
})
export class TransportRoundFinishPackDropPage extends PageComponent {

	public readonly listBoldValues = ['code', 'nature', 'temperature_range'];
	public readonly scannerMode: BarcodeScannerModeEnum = BarcodeScannerModeEnum.INVISIBLE;

	private natureTranslations: Translations;
	private round: TransportRound;
	private packs: Array<{
		code: string;
		nature: string;
		nature_id: number;
        dropped: boolean;
	}>;

	public packsToDropListConfig: {
		header: HeaderConfig;
		body: Array<ListPanelItemConfig>;
	};

	public packsDroppedListConfig: {
		header: HeaderConfig;
		body: Array<ListPanelItemConfig>;
	};

	private natureIdsToColors: { [natureId: number]: string };

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

		this.translationService.get('natures').subscribe((natureTranslations) => {
            this.natureTranslations = natureTranslations;
            this.refreshListToDropConfig();
            this.refreshListDroppedConfig();
		});
	}

	public ionViewWillLeave(): void {
		if (this.footerScannerComponent) {
			this.footerScannerComponent.unsubscribeZebraScan();
		}
	}

	private refreshListToDropConfig(): void {
		const packsToLoad = this.packs.filter(({dropped}) => !dropped);
		const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
		const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

		const hasPackToLoad = this.packs && this.packs.some(({dropped}) => !dropped);
		this.packsToDropListConfig = {
			header: {
				title: 'Colis à déposer',
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
			body: this.packs.map((pack) => ({
				...(TransportRoundFinishPackDropPage.packToListItemConfig(pack, natureTranslationCapitalized)),
				rightIcon: {
					color: 'grey' as IconColor,
					name: 'up.svg',
					action: () => this.loadPack(pack.code)
				}
			}))
		};
	}

	private refreshListDroppedConfig(): void {
		const loadedPacks = this.packs.filter(({dropped}) => dropped);
		const natureTranslation = TranslationService.Translate(this.natureTranslations, 'nature')
		const natureTranslationCapitalized = natureTranslation.charAt(0).toUpperCase() + natureTranslation.slice(1);

		const plural = loadedPacks.length > 1 ? 's' : '';
		this.packsDroppedListConfig = {
			header: {
				title: 'Colis scannés',
				info: `${loadedPacks.length} colis scanné${plural}`,
				leftIcon: {
					name: 'scanned-pack.svg',
					color: CardListColorEnum.GREEN
				}
			},
			body: loadedPacks.map((pack) => ({
				...(TransportRoundFinishPackDropPage.packToListItemConfig(pack, natureTranslationCapitalized)),
				...({
						pressAction: () => {
						},
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
			if (selectedItem.dropped) {
				this.toastService.presentToast(`Vous avez déjà déposé ce colis`);
			} else {
				this.packs.splice(selectedIndex, 1);
				this.packs.unshift(selectedItem);
				selectedItem.dropped = true;
				this.refreshListToDropConfig();
				this.refreshListDroppedConfig();
			}
		} else {
			this.toastService.presentToast(`Le colis scanné n'existe pas dans la liste`);
		}
	}

	private loadAll(): void {
		this.packs
			.filter(({dropped}) => !dropped)
			.forEach(({code}) => {
				this.loadPack(code);
			});
	}

	private revertPack(barCode: string): void {
		const selectedIndex = this.packs.findIndex(({code}) => code === barCode);
		if (selectedIndex > -1 && this.packs[selectedIndex].dropped) {
			this.packs[selectedIndex].dropped = false;

			this.refreshListToDropConfig();
			this.refreshListDroppedConfig();
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
				...(temperature_range ? {
					temperature_range: {
						label: 'Température',
						value: temperature_range
					}
				} : {})
			},
			color: color
		}
	}

	public validate(): void {
		const loadedPacks = this.packs.filter(({dropped}) => dropped);
		if (loadedPacks.length > 0) {
			this.navService.push(NavPathEnum.TRANSPORT_ROUND_PACK_LOAD_VALIDATE, {
				everythingLoaded: loadedPacks.length + this.packs.filter(({dropped}) => dropped).length === this.packs.length,
				packs: loadedPacks,
				round: this.round,
				onValidate: () => {
					for (const pack of loadedPacks) {
						pack.dropped = true;
					}

					this.toastService.presentToast('Les colis ont bien été chargés');
				}
			});
		} else {
			this.toastService.presentToast('Veuillez charger au moins un colis pour continuer');
		}
	}
}
