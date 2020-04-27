import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ToastService} from '@app/services/toast.service';
import {ArticleInventaire} from '@app/entities/article-inventaire';


@IonicPage()
@Component({
    selector: 'page-inventory-validate',
    templateUrl: 'inventory-validate.html',
})
export class InventoryValidatePage {

    public selectedArticle: ArticleInventaire;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private validateQuantity: (quantity: number) => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.selectedArticle = this.navParams.get('selectedArticle');
        this.validateQuantity = this.navParams.get('validateQuantity');
        const quantity = this.navParams.get('quantity');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Article', value: this.selectedArticle.reference},
                {label: 'Code barre', value: this.selectedArticle.barcode}
            ],
            fields: [
                {
                    label: 'Quantité relevée',
                    name: 'quantity',
                    type: 'number',
                    value: quantity ? `${quantity}` : ''
                }
            ]
        }
    }

    public addArticle(data): void {
        const {quantity} = data;

        if (isNaN(quantity) || quantity < 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.validateQuantity(quantity);
            this.navCtrl.pop();
        }
    }
}
