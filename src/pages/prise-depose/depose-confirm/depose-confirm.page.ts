import {Component, ViewChild} from '@angular/core';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {Emplacement} from '@entities/emplacement';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';
import {ActivatedRoute} from '@angular/router';
import {PageComponent} from '@pages/page.component';
import {SelectItemTypeEnum} from '@app/common/components/select-item/select-item-type.enum';


@Component({
    selector: 'wii-depose-confirm',
    templateUrl: './depose-confirm.page.html',
    styleUrls: ['./depose-confirm.page.scss'],
})
export class DeposeConfirmPage extends PageComponent {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelItemConfig>;

    private location: Emplacement;
    private validateDepose: (values: {comment: string; signature: string; photo: string; natureId: number}) => void;

    public constructor(private activatedRoute: ActivatedRoute,
                       private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.location = this.currentNavParams.get('location');
        this.validateDepose = this.currentNavParams.get('validateDepose');

        const barCode = this.currentNavParams.get('barCode');
        const comment = this.currentNavParams.get('comment');
        const signature = this.currentNavParams.get('signature');
        const photo = this.currentNavParams.get('photo');
        const natureId = this.currentNavParams.get('natureId');

        this.headerConfig = {
            title: `DEPOSE de ${barCode}`,
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: 'download.svg',
                color: 'success'
            }
        };

        this.bodyConfig = [
            {
                type: 'select',
                label: 'Type',
                name: 'natureId',
                value: natureId,
                inputConfig: {
                    required: true,
                    searchType: SelectItemTypeEnum.TRACKING_NATURES,
                    requestParams: ['hide <> 1']
                },
                errors: {
                    required: 'Vous devez sélectionner une nature'
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
                    required: 'Votre commentaire est requis',
                    maxlength: 'Votre commentaire est trop long'
                }
            },
            {
                type: 'signing',
                label: 'Signature',
                name: 'signature',
                value: signature,
                inputConfig: {}
            },
            {
                type: 'camera',
                label: 'Photo',
                name: 'photo',
                value: photo,
                inputConfig: {}
            }
        ];
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            const {comment, signature, photo, natureId} = this.formPanelComponent.values;
            this.validateDepose({comment, signature, photo, natureId});
            this.navService.pop();
        }
    }
}
