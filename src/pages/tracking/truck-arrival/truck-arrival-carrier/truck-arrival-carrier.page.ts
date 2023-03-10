import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {ToastService} from "@app/common/services/toast.service";
import {Transporteur} from '@entities/transporteur';

@Component({
    templateUrl: './truck-arrival-carrier.page.html',
    styleUrls: ['./truck-arrival-carrier.page.scss'],
})
export class TruckArrivalCarrierPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    private afterNext: (values) => void;

    public bodyConfig: Array<FormPanelParam>;

    public carrier: { id: number; text: string };

    public constructor(navService: NavService, public sqliteService: SqliteService, public toastService: ToastService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.afterNext = this.currentNavParams.get('afterNext');
        this.carrier = this.currentNavParams.get('carrier');
        this.generateForm();
    }

    public generateForm() {
        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: 'Transporteur',
                    name: 'carrier',
                    value: this.carrier ? this.carrier.id : null,
                    inputConfig: {
                        searchType: SelectItemTypeEnum.CARRIER,
                        onChange: (carrierId) => {
                            this.sqliteService
                                .findOneBy('status', {id: carrierId})
                                .subscribe((newCarrier?: Transporteur) => {
                                    this.carrier = {
                                        id: carrierId,
                                        text: newCarrier.label,
                                    }
                                })
                        }
                    },
                }
            },
        ]
    }

    public next() {
        if (this.carrier) {
            this.navService.pop().subscribe(() => {
                this.afterNext({
                    carrier: this.carrier,
                });
            })
        } else {
            this.toastService.presentToast('Veuillez sélectionner un transporteur.');
        }
    }
}
