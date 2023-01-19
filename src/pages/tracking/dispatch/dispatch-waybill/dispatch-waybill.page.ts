import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelInputComponent
} from "@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {ApiService} from "@app/common/services/api.service";
import {LoadingService} from "@app/common/services/loading.service";
import {
    FormPanelCalendarComponent
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component";
import {
    FormPanelCalendarMode
} from "@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar-mode";
import {HttpClient} from "@angular/common/http";
import {StorageService} from "@app/common/services/storage/storage.service";
import {StorageKeyEnum} from "@app/common/services/storage/storage-key.enum";
import {InAppBrowser} from "@ionic-native/in-app-browser/ngx";

@Component({
    selector: 'wii-dispatch-packs',
    templateUrl: './dispatch-waybill.page.html',
    styleUrls: ['./dispatch-waybill.page.scss'],
})
export class DispatchWaybillPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public bodyConfig: Array<FormPanelParam>;

    public dispatchId: number;

    public constructor(navService: NavService,
                       public apiService: ApiService,
                       public loading: LoadingService,
                       public storageService: StorageService,
                       public iab: InAppBrowser) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.dispatchId = this.currentNavParams.get('dispatchId');
        this.bodyConfig = [
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur',
                    name: 'consignor',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Destinataire',
                    name: 'receiver',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelCalendarComponent,
                config: {
                    label: 'Date d\'acheminement',
                    name: 'dispatchDate',
                    inputConfig: {
                        mode: FormPanelCalendarMode.DATETIME,
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur - Nom',
                    name: 'consignorUsername',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur - Téléphone - Email',
                    name: 'consignorEmail',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Destinataire - Nom',
                    name: 'receiverUsername',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Destinataire - Téléphone - Email',
                    name: 'receiverEmail',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Lieu de chargement',
                    name: 'locationFrom',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Lieu de déchargement',
                    name: 'locationTo',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Note de bas de page',
                    name: 'notes',
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
        ]
    }

    public validate() {
        const values = this.formPanelComponent.values;
        values.fromNomade = true;
        this.loading.presentLoadingWhile({
            event: () => {
                return this.apiService.requestApi(ApiService.DISPATCH_WAYBILL, {
                    pathParams: {dispatch: this.dispatchId},
                    params: values
                });
            }
        }).subscribe((response) => {
            this.storageService.getString(StorageKeyEnum.URL_SERVER).subscribe((url) => {
                this.navService.pop().subscribe(() => {
                    this.iab.create(url + response.filePath, '_system');
                });
            })
        })
    }
}
