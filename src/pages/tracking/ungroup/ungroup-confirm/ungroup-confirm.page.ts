import {Component} from '@angular/core';
import {HeaderConfig} from "@app/common/components/panel/model/header-config";
import * as moment from "moment";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {PageComponent} from "@pages/page.component";
import {NavService} from "@app/common/services/nav.service";
import {ListPanelItemConfig} from "@app/common/components/panel/model/list-panel/list-panel-item-config";
import {ApiService} from "@app/common/services/api.service";
import {ToastService} from "@app/common/services/toast.service";
import {Subscription} from 'rxjs';
import {ViewWillEnter, ViewWillLeave} from '@ionic/angular';
import {LoadingService} from '@app/common/services/loading.service';

@Component({
    selector: 'app-ungroup-confirm',
    templateUrl: './ungroup-confirm.page.html',
    styleUrls: ['./ungroup-confirm.page.scss'],
})
export class UngroupConfirmPage extends PageComponent implements ViewWillEnter, ViewWillLeave {

    public listConfig: any;
    public listBoldValues: Array<string>;
    private ungroupDate: string;
    private group: any;

    private loadingSubscription: Subscription;

    public constructor(private apiService: ApiService,
                       private toastService: ToastService,
                       private loadingService: LoadingService,
                       private sqlService: SqliteService,
                       navService: NavService) {
        super(navService);
        this.ungroupDate = moment().format('DD/MM/YYYY HH:mm:ss');
        this.listBoldValues = [
            'code'
        ];
    }

    async ionViewWillEnter() {
        this.group = this.currentNavParams.get(`group`);

        this.listConfig = {
            header: await this.createHeaderConfig(this.group),
            body: await this.createBodyConfig(this.group.packs),
        };
    }

    public ionViewWillLeave() {
        this.unsubscribeLoading();
    }

    private async createHeaderConfig(group): Promise<HeaderConfig> {
        const nature = await this.sqlService.findOneById(`nature`, group.natureId).toPromise();

        const subtitle = [
            `Objet : <b>${group.code}</b>`,
            `Nombre colis : ${group.packs.length}`,
            `Date/Heure : ${this.ungroupDate}`,
        ];

        if(nature) {
            subtitle.push(`Nature : ${nature.label}`);
        }

        return {
            subtitle,
            color: nature ? nature.color : '',
        };
    }

    private async createBodyConfig(packs): Promise<Array<ListPanelItemConfig>> {
        return await Promise.all(packs.map(async pack => {
            const nature = await this.sqlService.findOneById(`nature`, pack.nature_id).toPromise();

            return {
                color: nature ? nature.color : '',
                infos: {
                    code: {
                        label: 'Objet',
                        value: pack.code
                    },
                    quantity: {
                        label: 'Quantité',
                        value: pack.code
                    },
                    ...(nature ? {
                        nature: {
                            label: `Nature`,
                            value: nature.label,
                        },
                    } : {}),
                },
            }
        }));
    }

    public onSubmit() {
        if (!this.loadingSubscription) {
            const options = {
                params: {
                    location: this.currentNavParams.get(`location`).id,
                    group: this.group.id,
                    date: this.ungroupDate
                }
            };

            this.loadingSubscription = this.loadingService
                .presentLoadingWhile({event: () => this.apiService.requestApi(ApiService.UNGROUP, options)})
                .subscribe(
                    (response) => {
                        if (response.success) {
                            this.toastService.presentToast(response.msg);
                            this.navService.pop().subscribe(() =>
                                this.navService.pop().subscribe(() =>
                                    this.navService.pop()));
                        }
                        else {
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

}
