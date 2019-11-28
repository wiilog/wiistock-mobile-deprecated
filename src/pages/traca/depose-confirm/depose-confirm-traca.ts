import {Component, ViewChild} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {Emplacement} from '@app/entities/emplacement';
import {HeaderConfig} from '@helpers/components/panel/model/header-config';
import {FormPanelItemConfig} from '@helpers/components/panel/model/form-panel/form-panel-item-config';
import {FormPanelInputConfig} from '@helpers/components/panel/model/form-panel/form-panel-input-config';
import {FormPanelComponent} from '@helpers/components/panel/form-panel/form-panel.component';
import {FormPanelSigningConfig} from '@helpers/components/panel/model/form-panel/form-panel-signing-config';


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

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams) {
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
        this.headerConfig = {
            title: 'DEPOSE',
            subtitle: `Emplacement : ${this.location.label}`,
            leftIcon: {
                name: 'download.svg',
                color: 'success'
            }
        };
    }

    public onFormSubmit(): void {
    }
}
