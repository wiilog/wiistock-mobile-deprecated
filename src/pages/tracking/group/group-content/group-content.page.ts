import {Component, OnInit, ViewChild} from '@angular/core';
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import * as moment from "moment";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {IconColor} from "@app/common/components/icon/icon-color";
import {MovementConfirmType} from "@pages/prise-depose/movement-confirm/movement-confirm-type";
import {BarcodeScannerComponent} from "@app/common/components/barcode-scanner/barcode-scanner.component";
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';
import {LoadingService} from '@app/common/services/loading.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-group-content',
    templateUrl: './group-content.page.html',
    styleUrls: ['./group-content.page.scss'],
})
export class GroupContentPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loadingSubscription: Subscription;
    public listConfig: any;
    public listBoldValues: Array<string>;

    @ViewChild('footerScannerComponent', {static: false})
    public footerScannerComponent: BarcodeScannerComponent;

    private groupDate: string;
    private group: any;

    private apiPacksInProgress: Array<string>;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqlService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.groupDate = moment().format('DD/MM/YYYY HH:mm:ss');
        this.listBoldValues = [
            'code'
        ];
        this.apiPacksInProgress = [];
    }

    public async ionViewWillEnter() {
        this.apiPacksInProgress = [];
        if (this.footerScannerComponent) {
            this.footerScannerComponent.fireZebraScan();
        }

        if(!this.group) {
            this.group = this.currentNavParams.get(`group`);
            this.group.newPacks = [];
        }

        this.listConfig = {
            header: await this.createHeaderConfig(this.group),
            body: await this.createBodyConfig(this.group.newPacks),
        };
    }

    public ionViewWillLeave(): void {
        this.unsubscribeLoading();
        if (this.footerScannerComponent) {
            this.footerScannerComponent.unsubscribeZebraScan();
        }
    }

    public onPackScan(code: string): void {
        if (this.apiPacksInProgress.indexOf(code) === -1) {
            const selectedIndex = this.group.newPacks.findIndex(({code: savedCode}) => (savedCode === code));
            const options = {
                params: {code}
            };

            if (selectedIndex > -1) {
                this.toastService.presentToast(`Le colis <b>${code}</b> est déjà présent dans le groupe`);
            }
            else {
                this.apiPacksInProgress.push(code);
                this.apiService.requestApi(ApiService.PACKS_GROUPS, options)
                    .subscribe(
                        (response) => {
                            if (response.packGroup) {
                                this.treatPacks(code);
                                this.toastService.presentToast(`Le colis ${code} est un groupe`);
                            }
                            else {
                                let pack = response.pack || {
                                    code,
                                    nature_id: null,
                                    quantity: 1,
                                    date: moment().format('DD/MM/YYYY HH:mm:ss'),
                                };

                                this.group.newPacks.push(pack);
                                this.treatPacks(code);
                                this.refreshBodyConfig();
                                this.refreshHeaderConfig();
                            }
                        },
                        () => {
                            this.treatPacks(code);
                        });
            }
        }
    }

    private refreshBodyConfig() {
        this.createBodyConfig(this.group.newPacks)
            .then(config => this.listConfig.body = config);
    }

    private refreshHeaderConfig() {
        this.createHeaderConfig(this.group)
            .then(header => this.listConfig.header = header);
    }

    private async createHeaderConfig(group): Promise<HeaderConfig> {
        const nature = await this.sqlService.findOneById(`nature`, group.natureId).toPromise();
        const sScanned = this.group.newPacks.length > 0 ? 's' : '';

        return {
            title: `GROUPAGE`,
            info: `${this.group.newPacks.length} objet${sScanned} scanné${sScanned}`,
            item: {
                infos: {
                    object: {
                        label: `Objet`,
                        value: group.code,
                    },
                    packs: {
                        label: `Nombre colis`,
                        value: group.packs.length,
                    },
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
                color: nature ? nature.color : undefined,
            },
            rightIcon: {
                name: 'check.svg',
                color: 'success',
                action: () => this.onSubmit(),
            },
            leftIcon: {
                name: 'group.svg'
            }
        };
    }

    private async createBodyConfig(packs): Promise<Array<ListPanelItemConfig>> {
        return await Promise.all(packs.map(async pack => {
            const nature = await this.sqlService.findOneById(`nature`, pack.nature_id).toPromise();

            return {
                color: nature ? nature.color : undefined,
                infos: {
                    code: {
                        label: 'Objet',
                        value: pack.code
                    },
                    quantity: {
                        label: 'Quantité',
                        value: pack.quantity
                    },
                    date: {
                        label: 'Date/Heure',
                        value: pack.date
                    },
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
                pressAction: () => {
                    const {quantity, comment, signature, photo, nature_id: natureId, freeFields} = pack;
                    this.navService.push(NavPathEnum.MOVEMENT_CONFIRM, {
                        group: this.group,
                        fromStock: false,
                        barCode: pack.code,
                        values: {
                            quantity,
                            comment,
                            signature,
                            natureId,
                            photo,
                            freeFields
                        },
                        movementType: MovementConfirmType.GROUP,
                        validate: (values) => {
                            pack.quantity = values.quantity;
                            pack.comment = values.comment;
                            pack.signature = values.signature;
                            pack.photo = values.photo;
                            pack.nature_id = values.natureId;
                            pack.freeFields = values.freeFields;
                            this.refreshBodyConfig();
                        },
                    });
                },
                rightIcon: {
                    name: 'trash.svg',
                    color: 'danger' as IconColor,
                    action: () => {
                        this.group.newPacks.splice(this.group.newPacks.indexOf(pack), 1);
                        this.refreshBodyConfig();
                        this.refreshHeaderConfig();
                    }
                }
            }
        }));
    }

    public onSubmit() {
        if (!this.loadingSubscription) {
            const options = {
                params: {
                    id: this.group.id,
                    code: this.group.code,
                    date: this.groupDate,
                    packs: this.group.newPacks,
                }
            };

            this.loadingSubscription = this.loadingService
                .presentLoadingWhile({
                    event: () => this.apiService.requestApi(ApiService.GROUP, options)
                })
                .subscribe(
                    (response) => {
                        this.unsubscribeLoading();
                        if (response.success) {
                            this.toastService.presentToast(response.msg);
                            this.navService.pop().subscribe(() => this.navService.pop());
                        } else {
                            this.toastService.presentToast(`Erreur lors de la synchronisation du dégroupage`);
                        }
                    },
                    () => {
                        this.unsubscribeLoading();
                    }
                );
        }
    }

    private unsubscribeLoading() {
        if (this.loadingSubscription) {
            this.loadingSubscription.unsubscribe();
            this.loadingSubscription = undefined;
        }
    }

    private treatPacks(code: string): void {
        const index = this.apiPacksInProgress.indexOf(code);
        if (index > -1) {
            this.apiPacksInProgress.splice(index, 1);
        }
    }

}
