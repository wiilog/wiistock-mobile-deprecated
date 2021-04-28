import {Component, OnInit} from '@angular/core';
import {DemandeLivraison} from "@entities/demande-livraison";
import {DemandeLivraisonType} from "@entities/demande-livraison-type";
import {Emplacement} from "@entities/emplacement";
import {FreeField} from "@entities/free-field";
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import {IconColor} from "@app/common/components/icon/icon-color";
import * as moment from "moment";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {DemandeLivraisonArticle} from "@entities/demande-livraison-article";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {TrackingMenuPageRoutingModule} from "@pages/tracking/tracking-menu/tracking-menu-routing.module";

@Component({
    selector: 'app-ungroup-confirm',
    templateUrl: './ungroup-confirm.page.html',
    styleUrls: ['./ungroup-confirm.page.scss'],
})
export class UngroupConfirmPage extends PageComponent {

    public loading: boolean;
    public listConfig: any;
    private ungroupDate: string;
    private group: any;

    constructor(private apiService: ApiService, private toastService: ToastService,
                private sqlService: SqliteService, navService: NavService) {
        super(navService);
        this.ungroupDate = moment().format('DD/MM/YYYY HH:mm:ss');
    }

    async ionViewWillEnter() {
        this.group = this.currentNavParams.get(`group`);

        this.listConfig = {
            header: await this.createHeaderConfig(this.group),
            body: await this.createBodyConfig(this.group.packs),
        };
    }

    private async createHeaderConfig(group): Promise<HeaderConfig> {
        const nature = await this.sqlService.findOneById(`nature`, group.natureId).toPromise();

        const subtitle = [
            `Objet : ${group.code}`,
            `Nombre colis : ${group.packs.length}`,
            `Date/Heure : ${this.ungroupDate}`,
        ];

        if(nature) {
            subtitle.push(`Nature : ${nature.label}`);
        }

        return {
            subtitle,
            color: nature.color,
        };
    }

    private async createBodyConfig(packs): Promise<Array<ListPanelItemConfig>> {
        return await Promise.all(packs.map(async pack => {
            const nature = await this.sqlService.findOneById(`nature`, pack.nature_id).toPromise();

            return {
                color: nature.color,
                infos: {
                    code: {
                        label: 'Objet',
                        value: pack.code
                    },
                    quantity: {
                        label: 'Quantité',
                        value: pack.code
                    },
                    nature: {
                        label: 'Nature',
                        value: nature.label
                    },
                },
            }
        }));
    }

    public onSubmit() {
        const options = {
            params: {
                location: this.currentNavParams.get(`location`).id,
                group: this.group.id,
                date: this.ungroupDate
            }
        };

        this.apiService.requestApi(ApiService.UNGROUP, options).subscribe(response => {
            if (response.success) {
                this.toastService.presentToast(response.msg);
                this.navService.pop().subscribe(() =>
                    this.navService.pop().subscribe(() =>
                        this.navService.pop()));
            } else {
                this.toastService.presentToast(`Erreur lors de la synchronisation du dégroupage`);
            }
        })
    }

}
