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
    public quantite: number;
    public maxQuantity: number;
    private selectArticle: (quantity) => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.selectArticle = this.navParams.get('selectArticle');
        this.quantite = this.article.quantite;
        this.maxQuantity = this.article.quantite;
    }

    public addArticle(): void {
        if (this.quantite <= this.article.quantite && this.quantite > 0) {
            this.selectArticle(this.quantite);
            this.navCtrl.pop();
        }
        else {
            this.toastService.presentToast('Veuillez selectionner une quantité valide.');
        }
    }
}
