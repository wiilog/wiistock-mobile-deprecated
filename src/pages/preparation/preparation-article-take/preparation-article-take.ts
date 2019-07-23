import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {ArticlePrepa} from "../../../app/entities/articlePrepa";
import {PreparationArticlesPage} from "../preparation-articles/preparation-articles";
import {Preparation} from "../../../app/entities/preparation";

/**
 * Generated class for the PreparationArticleTakePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
    selector: 'page-preparation-article-take',
    templateUrl: 'preparation-article-take.html',
})
export class PreparationArticleTakePage {

    article: ArticlePrepa;
    quantite: number;
    preparation : Preparation;

    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        public toastController: ToastController) {
        if (typeof(navParams.get('article') !== undefined)) {
            this.article = navParams.get('article');
            this.quantite = this.article.quantite;
            this.preparation = navParams.get('preparation');
        }
    }

    addArticle() {
        if (this.quantite > this.article.quantite && this.quantite <= 0) {
            this.showToast('Veuillez selectionner une quantité valide.');
        } else {
            this.navCtrl.push(PreparationArticlesPage, {
                article : this.article,
                quantite : this.quantite,
                preparation : this.preparation,
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
