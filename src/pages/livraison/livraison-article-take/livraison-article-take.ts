import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {LivraisonArticlesPage} from '@pages/livraison/livraison-articles/livraison-articles';
import {ArticleLivraison} from '@app/entities/article-livraison';
import {Livraison} from '@app/entities/livraison';

/**
 * Generated class for the LivraisonArticleTakePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-livraison-article-take',
    templateUrl: 'livraison-article-take.html',
})
export class LivraisonArticleTakePage {

    article: ArticleLivraison;
    quantite: number;
    livraison : Livraison;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController) {
        if (typeof(navParams.get('article') !== undefined)) {
            this.article = navParams.get('article');
            this.quantite = this.article.quantite;
            this.livraison = navParams.get('livraison');
        }
    }

    addArticle() {
        if (this.quantite > this.article.quantite || this.quantite <= 0) {
            this.showToast('Veuillez selectionner une quantité valide.');
        } else {
            this.navCtrl.setRoot(LivraisonArticlesPage, {
                article : this.article,
                quantite : this.quantite,
                livraison : this.livraison,
                started : this.navParams.get('started'),
                valid : this.navParams.get('valid')
            })
        }
    }

    async showToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            position: 'center',
            cssClass: 'toast-error'
        });
        toast.present();
    }

}
