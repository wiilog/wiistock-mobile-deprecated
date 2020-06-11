import {Component, ViewChild} from '@angular/core';
import {of, zip} from 'rxjs';
import {SqliteService} from '@app/common/services/sqlite/sqlite.service';
import {DemandeLivraison} from '@entities/demande-livraison';
import {DemandeLivraisonType} from '@entities/demande-livraison-type';
import {StorageService} from '@app/common/services/storage.service';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {NavService} from '@app/common/services/nav.service';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {ToastService} from '@app/common/services/toast.service';


@Component({
    selector: 'wii-demande-livraison-header',
    templateUrl: './demande-livraison-header.page.html',
    styleUrls: ['./demande-livraison-header.page.scss'],
})
export class DemandeLivraisonHeaderPage {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public hasLoaded: boolean;

    public formBodyConfig: Array<FormPanelItemConfig>;

    private isUpdate: boolean;
    private demandeLivraisonToUpdate?: DemandeLivraison;

    public constructor(private sqliteService: SqliteService,
                       private toastService: ToastService,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private storageService: StorageService) {
        this.hasLoaded = false;
    }

    public ionViewWillEnter(): void {
        this.hasLoaded = false;

        const navParams = this.navService.getCurrentParams();
        const demandeId = navParams.get('demandeId');
        this.isUpdate = navParams.get('isUpdate');

        zip(
            this.isUpdate ? this.sqliteService.findBy('`demande_livraison`', [`id = ${demandeId}`]) : of(undefined),
            this.sqliteService.findAll('`demande_livraison_type`'),
            this.storageService.getOperateur()
        )
        .subscribe(([demandeLivraison, types, operator]: [DemandeLivraison|undefined, Array<DemandeLivraisonType>, string]) => {
            this.demandeLivraisonToUpdate = demandeLivraison;

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
                    name: 'type',
                    inputConfig: {
                        required: true,
                        searchType: SelectItemTypeEnum.DEMANDE_LIVRAISON_TYPE
                    },
                    errors: {
                        required: 'Vous devez sélectionner un type'
                    }
                },
                {
                    type: 'input',
                    label: 'Commentaire',
                    name: 'comment',
                    // TODO value: comment,
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
                    name: 'location',
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

    public onFormSubmit(): void {
        const error = this.formPanelComponent.firstError;
        if (error) {
            this.toastService.presentToast(error)
        }
        else {
            const {type_id, location_id, comment} = this.formPanelComponent.values;
            this.sqliteService
                .insert('demande_livraison', {type_id, location_id, comment})
                .subscribe((insertId) => {
                    this.demandeLivraisonToUpdate = {
                        id: insertId,
                        type_id,
                        location_id,
                        comment
                    };
                });
        }
    }
}
