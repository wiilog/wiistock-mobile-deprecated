import {Component} from '@angular/core';
import {ArticleLivraison} from '@entities/article-livraison';
import {NavService} from '@app/common/services/nav.service';
import {ToastService} from '@app/common/services/toast.service';

@Component({
    selector: 'wii-livraison-article-take',
    templateUrl: './livraison-article-take.page.html',
    styleUrls: ['./livraison-article-take.page.scss'],
})
export class LivraisonArticleTakePage {

    public article: ArticleLivraison;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity) => void;

    public constructor(private navService: NavService,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        const navParams = this.navService.getCurrentParams();
        this.article = navParams.get('article');
        this.selectArticle = navParams.get('selectArticle');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Article', value: this.article.reference},
                {label: 'Quantité à livrer', value: `${this.article.quantite}`}
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.article.quantite
                }
            ]
        }
    }

    public addArticle(data): void {
        const {quantity} = data;
        if (quantity && quantity <= this.article.quantite && quantity > 0) {
            this.selectArticle(quantity);
            this.navService.pop();
        }
        else {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
    }
}
