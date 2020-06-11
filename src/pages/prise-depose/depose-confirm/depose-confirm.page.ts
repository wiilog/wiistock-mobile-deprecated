import {Component, ViewChild} from '@angular/core';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {HeaderConfig} from '@app/common/components/panel/model/header-config';
import {FormPanelItemConfig} from '@app/common/components/panel/model/form-panel/form-panel-item-config';
import {Emplacement} from '@entities/emplacement';
import {ToastService} from '@app/common/services/toast.service';
import {NavService} from '@app/common/services/nav.service';


@Component({
    selector: 'wii-depose-confirm',
    templateUrl: './depose-confirm.page.html',
    styleUrls: ['./depose-confirm.page.scss'],
})
export class DeposeConfirmPage {
    @ViewChild('formPanelComponent', {static: false})
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelItemConfig>;

    private location: Emplacement;
    private validateDepose: (comment: string, signature: string) => void;

    public constructor(private navService: NavService,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.location = navParams.get('location');
        this.validateDepose = navParams.get('validateDepose');

        const barCode = navParams.get('barCode');
        const comment = navParams.get('comment');
        const signature = navParams.get('signature');

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
            }
        ];
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            const {comment, signature} = this.formPanelComponent.values;
            this.validateDepose(comment, signature);
            this.navService.pop();
        }
    }
}
