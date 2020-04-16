import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {ToastService} from "@app/services/toast.service";


@IonicPage()
@Component({
    selector: 'page-collecte-article-take',
    templateUrl: 'collecte-article-take.html',
})
export class CollecteArticleTakePage {

    public article: ArticleCollecte;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity: number) => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.selectArticle = this.navParams.get('selectArticle');

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
            this.selectArticle(quantity);
            this.navCtrl.pop();
        }
    }
}
