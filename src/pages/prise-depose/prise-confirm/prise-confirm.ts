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
    selector: 'page-prise-confirm',
    templateUrl: 'prise-confirm.html',
})
export class PriseConfirmPage {

    @ViewChild('formPanelComponent')
    public formPanelComponent: FormPanelComponent;

    public headerConfig: HeaderConfig;
    public bodyConfig: Array<FormPanelItemConfig<FormPanelInputConfig|FormPanelSigningConfig>>;

    private location: Emplacement;
    private validatePrise: (quantity: number) => void;

    private maxQuantity: number;

    public constructor(private navCtrl: NavController,
                       private toastService: ToastService,
                       private navParams: NavParams) {
        this.bodyConfig = [
            {
                type: 'input',
                label: 'Commentaire',
                name: 'quantity',
                inputConfig: {
                    type: 'text',
                    required: true,
                    min: 0,
                    max: this.maxQuantity
                },
                errors: {
                    required: 'La quantité est requise',
                    min: 'La quantité est invalide',
                    max: 'La quantité est trop élevée'
                }
            }
        ]
    }

    public ionViewWillEnter(): void {
        this.location = this.navParams.get('location');
        const barCode = this.navParams.get('barCode');
        this.validatePrise = this.navParams.get('validatePrise');
        this.headerConfig = {
            title: `PRISE de ${barCode}`,
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
            const {quantity} = this.formPanelComponent.values;
            this.validatePrise(quantity);
            this.navCtrl.pop();
        }
    }
}
