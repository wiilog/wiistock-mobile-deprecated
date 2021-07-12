import {Component} from '@angular/core';
import {NavService} from '@app/common/services/nav/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {ArticleCollecte} from '@entities/article-collecte';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-collecte-article-take',
    templateUrl: './collecte-article-take.page.html',
    styleUrls: ['./collecte-article-take.page.scss'],
})
export class CollecteArticleTakePage extends PageComponent {

    public article: ArticleCollecte;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity: number) => void;

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
                {label: 'Référence', value: this.article.reference},
                {label: 'Libellé référence', value: this.article.reference_label},
                {label: 'Code barre', value: this.article.barcode},
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
