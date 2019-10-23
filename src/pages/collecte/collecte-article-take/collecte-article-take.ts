import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {CollecteArticlesPage} from '@pages/collecte/collecte-articles/collecte-articles';
import {ArticleCollecte} from '@app/entities/article-collecte';
import {Collecte} from '@app/entities/collecte';

/**
 * Generated class for the LivraisonArticleTakePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-collecte-article-take',
    templateUrl: 'collecte-article-take.html',
})
export class CollecteArticleTakePage {

    article: ArticleCollecte;
    quantite: number;
    collecte : Collecte;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController) {
        if (typeof(navParams.get('article') !== undefined)) {
            this.article = navParams.get('article');
            this.quantite = this.article.quantite;
            this.collecte = navParams.get('collecte');
        }
    }

    addArticle() {
        if (this.quantite > this.article.quantite || this.quantite <= 0) {
            this.showToast('Veuillez selectionner une quantité valide.');
        } else {
            this.navCtrl.setRoot(CollecteArticlesPage, {
                article : this.article,
                quantite : this.quantite,
                collecte : this.collecte,
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
