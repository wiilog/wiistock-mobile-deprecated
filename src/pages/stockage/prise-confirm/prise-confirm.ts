import { Component } from '@angular/core';
import {IonicPage, NavController, NavParams, ToastController} from 'ionic-angular';
import {PriseArticlesPage} from "../prise-articles/prise-articles";
import {Article} from "../../../app/entities/article";
import {SqliteProvider} from "../../../providers/sqlite/sqlite";
import {Emplacement} from "../../../app/entities/emplacement";

@IonicPage()
@Component({
  selector: 'page-prise-confirm',
  templateUrl: 'prise-confirm.html',
})
export class PriseConfirmPage {

  quantite: number;
  id: number;
  articles: Array<Article>;
  db_articles: Array<Article>;
  emplacement: Emplacement;

  constructor(public navCtrl: NavController, public navParams: NavParams, public sqliteProvider: SqliteProvider, private toastController: ToastController) {
    this.articles = navParams.get('articles');
    this.emplacement = navParams.get('emplacement');
    this.db_articles = this.sqliteProvider.findAll('article');
    if (navParams.get('selectedArticle') !== undefined) {
        this.id = navParams.get('selectedArticle')['id'];
    }
  }

  addArticle() {
      this.sqliteProvider.findOne('article', this.id).then((article) => {
          if (article) {
              article.quantite = this.quantite;

              if (typeof(this.articles) !== 'undefined') {
                  this.articles.push(article);
              } else {
                  this.articles = [article];
              }
              this.navCtrl.push(PriseArticlesPage, {articles: this.articles, emplacement: this.emplacement});
          } else {
              this.showToast("Cet article n'existe pas en stock.");
          }

      });
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
