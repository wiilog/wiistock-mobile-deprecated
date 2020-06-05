import {Component} from '@angular/core';
import {NavService} from '@app/common/services/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {ArticleCollecte} from '@entities/article-collecte';

@Component({
    selector: 'wii-collecte-article-take',
    templateUrl: './collecte-article-take.page.html',
    styleUrls: ['./collecte-article-take.page.scss'],
})
export class CollecteArticleTakePage {

    public article: ArticleCollecte;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity: number) => void;

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
                {label: 'Quantité à collecter', value: `${this.article.quantite}`}
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
        if (quantity && quantity > this.article.quantite || quantity <= 0) {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
        else {
            this.navService.pop().subscribe(() => {
                this.selectArticle(quantity);
            });
        }
    }
}
