import {Component} from '@angular/core';
import {ArticleInventaire} from '@entities/article-inventaire';
import {NavService} from '@app/common/services/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-inventory-validate',
    templateUrl: './inventory-validate.page.html',
    styleUrls: ['./inventory-validate.page.scss'],
})
export class InventoryValidatePage extends PageComponent {

    public selectedArticle: ArticleInventaire;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private validateQuantity: (quantity: number) => void;

    public constructor(private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.selectedArticle = navParams.get('selectedArticle');
        this.validateQuantity = navParams.get('validateQuantity');
        const quantity = navParams.get('quantity');

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
            this.navService.pop().subscribe(() => {
                this.validateQuantity(quantity);
            });
        }
    }
}
