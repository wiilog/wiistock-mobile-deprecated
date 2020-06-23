import {Component} from '@angular/core';
import {ArticlePrepa} from '@entities/article-prepa';
import {ArticlePrepaByRefArticle} from '@entities/article-prepa-by-ref-article';
import {Preparation} from '@entities/preparation';
import {NavService} from '@app/common/services/nav.service';
import {ToastService} from '@app/common/services/toast.service';
import {PageComponent} from '@pages/page.component';

@Component({
    selector: 'wii-preparation-article-take',
    templateUrl: './preparation-article-take.page.html',
    styleUrls: ['./preparation-article-take.page.scss'],
})
export class PreparationArticleTakePage extends PageComponent {

    public article: ArticlePrepa & ArticlePrepaByRefArticle;
    public refArticle: ArticlePrepa;
    public preparation: Preparation;

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
        const navParams = this.navService.getCurrentParams();
        this.article = navParams.get('article');
        this.refArticle = navParams.get('refArticle');
        this.preparation = navParams.get('preparation');
        this.selectArticle = navParams.get('selectArticle');

        this.simpleFormConfig = {
            title: 'Confirmation quantité',
            info: [
                ...(this.article.isSelectableByUser ? [{label: 'Référence', value: this.article.reference_article}] : []),
                {label: 'Article', value: this.article.reference},
                {label: 'Quantité à prélever', value: `${this.quantityToSelect}`},
                ...(this.quantityToSelect !== this.availableQuantity ? [{label: 'Quantité disponible', value: `${this.availableQuantity}`}] : []),
            ],
            fields: [
                {
                    label: 'Quantité souhaitée',
                    name: 'quantity',
                    type: 'number',
                    value: this.maxQuantityAvailable
                }
            ]
        }
    }

    public addArticle(data): void {
        const {quantity} = data;
        const maxQuantityAvailable = this.maxQuantityAvailable;

        if (!quantity || (quantity > maxQuantityAvailable) || quantity <= 0) {
            this.toastService.presentToast('Veuillez sélectionner une quantité valide.');
        }
        else {
            this.navService.pop().subscribe(() => {
                this.selectArticle(quantity);
            });
        }
    }

    public get availableQuantity(): number {
        return this.article && (this.article.isSelectableByUser ? this.article.quantity : this.article.quantite);
    }

    public get quantityToSelect(): number {
        return this.article && (this.article.isSelectableByUser ? this.refArticle.quantite : this.article.quantite);
    }

    public get maxQuantityAvailable(): number {
        const availableQuantity = this.availableQuantity;
        const quantityToSelect = this.quantityToSelect;
        return (availableQuantity < quantityToSelect) ? availableQuantity : quantityToSelect;
    }
}
