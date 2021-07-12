import {Component} from '@angular/core';
import {ArticleLivraison} from '@entities/article-livraison';
import {NavService} from '@app/common/services/nav/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-livraison-article-take',
    templateUrl: './livraison-article-take.page.html',
    styleUrls: ['./livraison-article-take.page.scss'],
})
export class LivraisonArticleTakePage extends PageComponent {

    public article: ArticleLivraison;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity) => void;

    public constructor(private toastService: ToastService,
                       navService: NavService) {
        super(navService);
    }

    public ionViewWillEnter(): void {
        this.article = this.currentNavParams.get('article');
        this.selectArticle = this.currentNavParams.get('selectArticle');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                {label: 'Article', value: this.article.reference},
                {label: 'Quantité à livrer', value: `${this.article.quantity}`}
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.article.quantity
                }
            ]
        }
    }

    public addArticle(data): void {
        const {quantity} = data;
        if (quantity && quantity <= this.article.quantity && quantity > 0) {
            this.selectArticle(quantity);
            this.navService.pop();
        }
        else {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
    }
}
