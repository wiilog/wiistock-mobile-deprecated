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
    selector: 'page-depose-confirm-traca',
    templateUrl: 'depose-confirm-traca.html',
})
export class DeposeConfirmPageTraca {

    @ViewChild('formPanelComponent')
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelItemConfig<FormPanelInputConfig|FormPanelSigningConfig>>;

    private location: Emplacement;
    private validateDepose: (comment: string, signature: string) => void;

    public constructor(private navCtrl: NavController,
                       private toastService: ToastService,
                       private navParams: NavParams) {
        this.bodyConfig = [
            {
                type: 'input',
                label: 'Commentaire',
                name: 'comment',
                inputConfig: {
                    type: 'text',
                    required: true,
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
                inputConfig: {}
            }
        ]
    }

    public ionViewWillEnter(): void {
        this.location = this.navParams.get('location');
        const barCode = this.navParams.get('barCode');
        this.validateDepose = this.navParams.get('validateDepose');
        this.headerConfig = {
            title: `DEPOSE du colis ${barCode}`,
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: 'download.svg',
                color: 'success'
            }
        };
    }

    public onFormSubmit(): void {
        const formError = this.formPanelComponent.firstError;
        if (formError) {
            this.toastService.presentToast(formError);
        }
        else {
            const {comment, signature} = this.formPanelComponent.values;
            console.log(this.formPanelComponent.values);
            this.validateDepose(comment, signature);
            this.navCtrl.pop();
        }
    }
}
