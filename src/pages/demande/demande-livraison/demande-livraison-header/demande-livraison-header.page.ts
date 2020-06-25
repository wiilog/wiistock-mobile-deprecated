import {Component, ViewChild} from '@angular/core';
import {of, zip} from 'rxjs';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {StorageService} from '@app/common/services/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {NavService} from '@app/common/services/nav.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {ToastService} from '@app/common/services/toast.service';
import {DemandeLivraisonArticlesPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles-routing.module';
import {map} from 'rxjs/operators';
import {PageComponent} from '@pages/page.component';


@Component({
    selector: 'wii-demande-livraison-header',
    templateUrl: './demande-livraison-header.page.html',
    styleUrls: ['./demande-livraison-header.page.scss'],
})
export class DemandeLivraisonHeaderPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public hasLoaded: boolean;

    public formBodyConfig: Array<FormPanelItemConfig>;

    private isUpdate: boolean;
    private demandeLivraisonToUpdate?: DemandeLivraison;

    private operatorId: number;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private mainHeaderService: MainHeaderService,
                       private storageService: StorageService,
                       navService: NavService) {
        super(navService);
        this.hasLoaded = false;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;

        const demandeId = this.currentNavParams.get('demandeId');
        this.isUpdate = this.currentNavParams.get('isUpdate');

        this.formPanelComponent.fireZebraScan();

        zip(
            this.storageService.getOperatorId(),
            this.isUpdate ? this.sqliteService.findOneById('`demande_livraison`', demandeId) : of(this.demandeLivraisonToUpdate),
            this.storageService.getOperator()
        )
        .subscribe(([operatorId, demandeLivraison, operator]: [number, DemandeLivraison|undefined, string]) => {
            this.demandeLivraisonToUpdate = demandeLivraison;
            this.operatorId = operatorId;
            const {type_id: type, location_id: location, comment} = (demandeLivraison || {});
            this.formBodyConfig = [
                {
                    type: 'input',
                    label: 'Demandeur',
                    name: 'requester',
                    value: operator,
                    inputConfig: {
                        type: 'text',
                        disabled: true
                    }
                },
                {
                    type: 'select',
                    label: 'Type',
                    name: 'type_id',
                    value: type,
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE,
                        requestParams: ['to_delete IS NULL']
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type'
                    }
                },
                {
                    type: 'input',
                    label: 'Commentaire',
                    name: 'comment',
                    value: comment,
                    inputConfig: {
                        type: 'text',
                        maxLength: '255'
                    },
                    errors: {
                        maxlength: 'Votre commentaire est trop long'
                    }
                },
                {
                    type: 'select',
                    label: 'Destination',
                    name: 'location_id',
                    value: location,
                    inputConfig: {
                        required: true,
                        barcodeScanner: true,
                        searchType: SelectItemTypeEnum.LOCATION
                    },
                    errors: {
                        required: 'Vous devez sélectionner une destination'
                    }
                },
            ]

            this.hasLoaded = true;
        });
    }

    public ionViewWillLeave(): void {
        this.formPanelComponent.unsubscribeZebraScan();
    }

    public onFormSubmit(): void {
        const error = this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        }
        else {
            const {type_id, location_id, comment} = this.formPanelComponent.values;
            const user_id = this.operatorId;
            const values = {type_id, location_id, comment, user_id};
            (
                this.isUpdate
                    ? this.sqliteService
                        .update('demande_livraison', values, [`id = ${this.demandeLivraisonToUpdate.id}`])
                        .pipe(map(() => this.demandeLivraisonToUpdate.id))
                    : this.sqliteService.insert('demande_livraison', values)
            )
                .subscribe((insertId) => {
                    this.demandeLivraisonToUpdate = {
                        id: insertId,
                        ...values
                    };
                    this.navService.push(DemandeLivraisonArticlesPageRoutingModule.PATH, {
                        demandeId: insertId,
                        isUpdate: this.isUpdate
                    });
                });
        }
    }
}
