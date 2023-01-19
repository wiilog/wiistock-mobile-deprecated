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
import {DispatchPack} from "@entities/dispatch-pack";

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

    public afterValidate: (data) => void;
    public data = {} as any;

    public constructor(navService: NavService,
                       public apiService: ApiService,
                       public loading: LoadingService,
                       public storageService: StorageService,) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.dispatchId = this.currentNavParams.get('dispatchId');
        this.afterValidate = this.currentNavParams.get('afterValidate');
        this.data = this.currentNavParams.get('data');
        this.bodyConfig = [
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    value: this.data.carrier || null,
                    inputConfig: {
                        type: 'text',
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Expéditeur',
                    value: this.data.consignor || null,
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
                    value: this.data.receiver || null,
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
                    value: this.data.dispatchDate || null,
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
                    value: this.data.consignorUsername || null,
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
                    value: this.data.consignorEmail || null,
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
                    value: this.data.receiverUsername || null,
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
                    value: this.data.receiverEmail || null,
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
                    value: this.data.locationFrom || null,
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
                    value: this.data.locationTo || null,
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
                    value: this.data.notes || null,
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
        this.navService.pop().subscribe(() => {
            this.afterValidate(values);
        })
    }
}
