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
    private selectArticle: (quantity) => void;

    public constructor(private navCtrl: NavController,
                       private navParams: NavParams,
                       private toastService: ToastService) {
    }

    public ionViewWillEnter(): void {
        this.article = this.navParams.get('article');
        this.quantite = this.article.quantite;
    }

    addArticle() {
        if (this.quantite > this.article.quantite || this.quantite <= 0) {
            this.toastService.showToast('Veuillez selectionner une quantité valide.');
        } else {
            this.selectArticle(this.quantite);
            this.navCtrl.pop();
        }
    }

}
