import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {PageComponent} from '@pages/page.component';
import {FormPanelParam} from "@app/common/directives/form-panel/form-panel-param";
import {
    FormPanelSelectComponent
} from "@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component";
import {SelectItemTypeEnum} from "@app/common/components/select-item/select-item-type.enum";
import {FormPanelComponent} from "@app/common/components/panel/form-panel/form-panel.component";
import {TranslationService} from "@app/common/services/translations.service";
import {Translations} from "@entities/translation";
import {filter} from "rxjs/operators";
import {Status} from "@entities/status";
import {SqliteService} from "@app/common/services/sqlite/sqlite.service";
import {Emplacement} from "@entities/emplacement";
import {ToastService} from "@app/common/services/toast.service";

@Component({
    selector: 'wii-filter-validate',
    templateUrl: './dispatch-filter.page.html',
    styleUrls: ['./dispatch-filter.page.scss'],
})
export class DispatchFilterPage extends PageComponent {

    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    private afterValidate: (values) => void;
    private dispatchTranslations: Translations;

    public bodyConfig: Array<FormPanelParam>;

    public status: { id: number; text: string };
    public type: { id: number; text: string };
    public from: { id: number; text: string };
    public to: { id: number; text: string };

    public constructor(navService: NavService, public translationService: TranslationService, public sqliteService: SqliteService, public toastService: ToastService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        this.afterValidate = this.currentNavParams.get('afterValidate');
        this.status = this.currentNavParams.get('status');
        this.to = this.currentNavParams.get('to');
        this.from = this.currentNavParams.get('from');
        this.type = this.currentNavParams.get('type');
        this.translationService.get(`Demande`, `Acheminements`, `Champs fixes`).subscribe((translations) => {
            this.dispatchTranslations = translations;
            this.bodyConfig = [
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de prise'),
                        name: 'from',
                        value: this.from ? this.from.id : null,
                        inputConfig: {
                            searchType: SelectItemTypeEnum.LOCATION,
                            onChange: (fromId) => {
                                this.sqliteService
                                    .findOneBy('emplacement', {id: fromId})
                                    .subscribe((location?: Emplacement) => {
                                        this.from = {
                                            id: fromId,
                                            text: location.label,
                                        }
                                    })
                            }
                        },
                    }
                },
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: TranslationService.Translate(this.dispatchTranslations, 'Emplacement de dépose'),
                        name: 'to',
                        value: this.to ? this.to.id : null,
                        inputConfig: {
                            searchType: SelectItemTypeEnum.LOCATION,
                            onChange: (toId) => {
                                this.sqliteService
                                    .findOneBy('emplacement', {id: toId})
                                    .subscribe((location?: Emplacement) => {
                                        this.to = {
                                            id: toId,
                                            text: location.label,
                                        }
                                    })
                            }
                        },
                    }
                },
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Statut',
                        name: 'status',
                        value: this.status ? this.status.id : null,
                        inputConfig: {
                            searchType: SelectItemTypeEnum.STATUS,
                            requestParams: [
                                `category = 'acheminement'`,
                            ],
                            onChange: (statusId) => {
                                this.sqliteService
                                    .findOneBy('status', {id: statusId})
                                    .subscribe((newStatus?: Status) => {
                                        this.status = {
                                            id: statusId,
                                            text: newStatus.label,
                                        }
                                    })
                            }
                        },
                    }
                },
                {
                    item: FormPanelSelectComponent,
                    config: {
                        label: 'Type',
                        name: 'type',
                        value: this.type ? this.type.id : null,
                        inputConfig: {
                            searchType: SelectItemTypeEnum.DISPATCH_TYPE,
                            onChange: (typeId) => {
                                this.sqliteService
                                    .findOneBy('dispatch_type', {id: typeId})
                                    .subscribe((newType?: any) => {
                                        this.type = {
                                            id: newType.id,
                                            text: newType.label,
                                        }
                                    })
                            }
                        },
                    }
                },
            ]
        })
    }

    public validate() {
        if (this.status && this.type && (this.from || this.to)) {
            this.navService.pop().subscribe(() => {
                this.afterValidate({
                    from: this.from,
                    to: this.to,
                    type: this.type,
                    status: this.status,
                });
            })
        } else {
            this.toastService.presentToast('Veuillez saisir un statut, un type ainsi qu\'un emplacement de prise ou de dépose dans les filtres.');
        }
    }
}
