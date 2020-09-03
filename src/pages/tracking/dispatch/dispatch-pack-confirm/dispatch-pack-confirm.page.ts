import {Component, ViewChild} from '@angular/core';
import {NavService} from '@app/common/services/nav.service';
import {PageComponent} from '@pages/page.component';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {LoadingService} from '@app/common/services/loading.service';
import {Dispatch} from '@entities/dispatch';
import {CardListColorEnum} from '@app/common/components/card-list/card-list-color.enum';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {ToastService} from '@app/common/services/toast.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {LocalDataManagerService} from '@app/common/services/local-data-manager.service';
import {DispatchPack} from '@entities/dispatch-pack';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelParam} from '@app/common/directives/form-panel/form-panel-param';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {Nature} from '@entities/nature';


@Component({
    selector: 'wii-dispatch-pack-confirm',
    templateUrl: './dispatch-pack-confirm.page.html',
    styleUrls: ['./dispatch-pack-confirm.page.scss'],
})
export class DispatchPackConfirmPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelParam>;

    private confirmPack: (pack: DispatchPack) => void;
    private natureTranslationLabel: string;
    private pack: DispatchPack;
    private dispatch: Dispatch;

    public constructor(private sqliteService: SqliteService,
                       private loadingService: LoadingService,
                       private mainHeaderService: MainHeaderService,
                       private localDataManagerService: LocalDataManagerService,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }


    public ionViewWillEnter(): void {
        this.pack = this.currentNavParams.get('pack');
        const dispatch: Dispatch = this.currentNavParams.get('dispatch');
        this.confirmPack = this.currentNavParams.get('confirmPack');
        this.natureTranslationLabel = this.currentNavParams.get('natureTranslationLabel');

        this.headerConfig = {
            title: `Colis ${this.pack.code}`,
            subtitle: [
                `Demande ${dispatch.number}`,
                `Emplacement de dépose : ${dispatch.locationToLabel}`
            ],
            leftIcon: {
                color: CardListColorEnum.GREEN,
                name: 'stock-transfer.svg'
            }
        };

        this.bodyConfig = [
            {
                item: FormPanelSelectComponent,
                config: {
                    label: this.natureTranslationLabel,
                    name: 'natureId',
                    value: this.pack.natureId,
                    inputConfig: {
                        required: false,
                        searchType: SelectItemTypeEnum.TRACKING_NATURES,
                        filterItem: (nature: Nature) => (!nature.hide)
                    }
                }
            },
            {
                item: FormPanelInputComponent,
                config: {
                    label: 'Quantité',
                    name: 'quantity',
                    value: this.pack.quantity || 1,
                    inputConfig: {
                        type: 'number'
                    }
                }
            }
        ];
    }

    public onFormSubmit(): void {
        if (this.formPanelComponent.firstError) {
            this.toastService.presentToast(this.formPanelComponent.firstError);
        }
        else {
            const {quantity, natureId} = this.formPanelComponent.values;
            this.confirmPack({
                ...this.pack,
                quantity,
                natureId
            });
            this.navService.pop();
        }
    }
}
