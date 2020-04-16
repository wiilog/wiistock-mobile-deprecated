import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams} from 'ionic-angular';
import {ArticleLivraison} from '@app/entities/article-livraison';
import {ToastService} from '@app/services/toast.service';


@IonicPage()
@Component({
    selector: 'page-livraison-article-take',
    templateUrl: 'livraison-article-take.html',
})
export class LivraisonArticleTakePage {

    public article: ArticleLivraison;

    public simpleFormConfig: {
        title: string;
        info: Array<{label: string; value: string;}>
        fields: Array<{label: string; name: string; type: string; value: string|number;}>
    };

    private selectArticle: (quantity) => void;

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
            this.navCtrl.pop();
        }
        else {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
    }
}
