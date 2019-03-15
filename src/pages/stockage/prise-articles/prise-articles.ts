import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseConfirmPage } from "../prise-confirm/prise-confirm";
import { MenuPage } from "../../menu/menu";
import { Mouvement} from "../../../app/entities/mouvement";
import { Article } from "../../../app/entities/article";
import { ArticleMouvement } from "../../../app/entities/article_mouvement";
import { Emplacement } from "../../../app/entities/emplacement";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import {StockageMenuPage} from "../stockage-menu/stockage-menu";


@IonicPage()
@Component({
  selector: 'page-prise-articles',
  templateUrl: 'prise-articles.html',
})
export class PriseArticlesPage {

  emplacement: Emplacement;
  articles: Array<Article>;
  mouvement: Mouvement;

  constructor(public navCtrl: NavController, public navParams: NavParams, private toastController: ToastController, private sqliteProvider: SqliteProvider) {
    if (typeof(navParams.get('emplacement')) !== undefined) {
      this.emplacement = navParams.get('emplacement');
    }

    if (typeof(navParams.get('articles')) !== undefined) {
      this.articles = navParams.get('articles');
    }
  }

  addArticleManually() {
    this.navCtrl.push(PriseConfirmPage, {
      articles: this.articles, emplacement: this.emplacement
    });
  }

  finishTaking() {
    this.mouvement = {
      id: null,
      type: 'prise',
      id_emplacement: this.emplacement.id,
      date: Date(),
      username: 'cegaz'
    }; //TODO

    this.sqliteProvider.insert('mouvement', this.mouvement)
        .then((data) => {
          this.mouvement.id = data.insertId;

          for (let article of this.articles) {
            let article_mouvement = new ArticleMouvement();
            article_mouvement.id_article = article.id;
            article_mouvement.id_mouvement = this.mouvement.id;

            this.sqliteProvider.insert('article_mouvement', article_mouvement)
                .then((data) => {
                  console.log(data);
                });
          }

          this.navCtrl.push(StockageMenuPage);
        });
  }

  // Helper
  async showToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

}
