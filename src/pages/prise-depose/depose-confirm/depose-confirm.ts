import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {FormPanelItemConfig} from '@helpers/components/panel/model/form-panel/form-panel-item-config';
import {FormPanelInputConfig} from '@helpers/components/panel/model/form-panel/form-panel-input-config';
import {FormPanelComponent} from '@helpers/components/panel/form-panel/form-panel.component';
import {FormPanelSigningConfig} from '@helpers/components/panel/model/form-panel/form-panel-signing-config';
import {ToastService} from '@app/services/toast.service';


@IonicPage()
@Component({
    selector: 'page-depose-confirm',
    templateUrl: 'depose-confirm.html',
})
export class DeposeConfirmPage {

    @ViewChild('formPanelComponent')
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelItemConfig<FormPanelInputConfig|FormPanelSigningConfig>>;

    private location: Emplacement;
    private validateDepose: (comment: string, signature: string) => void;

    public constructor(private navCtrl: NavController,
                       private toastService: ToastService,
                       private navParams: NavParams) {
    }

    public ionViewWillEnter(): void {
        this.location = this.navParams.get('location');
        this.validateDepose = this.navParams.get('validateDepose');

        const barCode = this.navParams.get('barCode');
        const comment = this.navParams.get('comment');
        const signature = this.navParams.get('signature');

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
            this.navCtrl.pop();
        }
    }
}
