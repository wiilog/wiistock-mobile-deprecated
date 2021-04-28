import {Component, OnInit} from '@angular/core';
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import * as moment from "moment";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {GroupContentPageRoutingModule} from "@pages/tracking/group/group-content/group-content-routing.module";
import {BarcodeScannerModeEnum} from "@app/common/components/barcode-scanner/barcode-scanner-mode.enum";
import {TrackingListFactoryService} from "@app/common/services/tracking-list-factory.service";
import {IconColor} from "@app/common/components/icon/icon-color";
import {MovementConfirmPageRoutingModule} from "@pages/prise-depose/movement-confirm/movement-confirm-routing.module";
import {MovementConfirmType} from "@pages/prise-depose/movement-confirm/movement-confirm-type";

@Component({
    selector: 'app-group-content',
    templateUrl: './group-content.page.html',
    styleUrls: ['./group-content.page.scss'],
})
export class GroupContentPage extends PageComponent {

    public readonly scannerModeManual: BarcodeScannerModeEnum = BarcodeScannerModeEnum.WITH_MANUAL;

    public loading: boolean;
    public listConfig: any;
    private groupDate: string;
    private group: any;

    constructor(private apiService: ApiService, private toastService: ToastService,
                private sqlService: SqliteService, navService: NavService) {
        super(navService);
        this.groupDate = moment().format('DD/MM/YYYY HH:mm:ss');
    }

    async ionViewWillEnter() {
        console.error(this.group);
        if(!this.group) {
            this.group = this.currentNavParams.get(`group`);
            this.group.newPacks = [];
        }

        this.listConfig = {
            header: await this.createHeaderConfig(this.group),
            body: await this.createBodyConfig(this.group.newPacks),
        };
    }

    public onPackScan(code: string): void {
        const options = {
            params: {code}
        };

        if (this.group.packs.find(pack => pack.code === code) || this.group.newPacks.find(pack => pack.code === code)) {
            this.toastService.presentToast(`Le colis ${code} est déjà présent dans le groupe`);
            return;
        }

        this.apiService.requestApi(ApiService.PACKS_GROUPS, options)
            .subscribe(response => {
                if (response.packGroup) {
                    this.toastService.presentToast(`Le colis ${code} est un groupe`);
                } else {
                    let pack = response.pack ?? {
                        code,
                        nature_id: null,
                        quantity: 1,
                        date: moment().format('DD/MM/YYYY HH:mm:ss'),
                    };

                    this.group.newPacks.push(pack);
                    this.refreshBodyConfig();
                }
            })
    }

    private refreshBodyConfig() {
        this.createBodyConfig(this.group.newPacks)
            .then(config => this.listConfig.body = config);
    }

    private async createHeaderConfig(group): Promise<HeaderConfig> {
        const nature = await this.sqlService.findOneById(`nature`, group.natureId).toPromise();

        return {
            title: `Groupage`,
            subtitle: `<i>${this.group.newPacks.length} objets scannés</i>`,
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
                        value: pack.code
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
                    this.navService.push(MovementConfirmPageRoutingModule.PATH, {
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
                            console.log(values, pack, this.group);
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
                        console.error("nonono");
                    }
                }
            }
        }));
    }

    public onSubmit() {
        const options = {
            params: {
                id: this.group.id,
                code: this.group.code,
                date: this.groupDate,
                packs: this.group.newPacks,
            }
        };

        this.apiService.requestApi(ApiService.GROUP, options).subscribe(response => {
            if (response.success) {
                this.toastService.presentToast(response.msg);
                this.navService.pop().subscribe(() => this.navService.pop());
            } else {
                this.toastService.presentToast(`Erreur lors de la synchronisation du dégroupage`);
            }
        })
    }

}
