import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ArticlePrepa} from '@app/entities/article-prepa';
import {Preparation} from '@app/entities/preparation';
import {ToastService} from "@app/services/toast.service";
import {ArticlePrepaByRefArticle} from "@app/entities/article-prepa-by-ref-article";


@IonicPage()
@Component({
    selector: 'page-preparation-article-take',
    templateUrl: 'preparation-article-take.html',
})
export class PreparationArticleTakePage {

    public article: ArticlePrepa & ArticlePrepaByRefArticle;
    public refArticle: ArticlePrepa;
    public preparation: Preparation;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private onlyOne: boolean;
    private selectArticle: (quantity: number) => void;

    public constructor(public navCtrl: NavController,
                       public navParams: NavParams,
                       public toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.refArticle = this.navParams.get('refArticle');
        this.preparation = this.navParams.get('preparation');
        this.selectArticle = this.navParams.get('selectArticle');
        this.onlyOne = this.navParams.get('onlyOne');

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
        else if (this.onlyOne && quantity !== maxQuantityAvailable) {
            this.toastService.presentToast(`La quantité souhaitée doit obligatoirement être égale à `);
        }
        else {
            this.selectArticle(quantity);
            this.navCtrl.pop();
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
