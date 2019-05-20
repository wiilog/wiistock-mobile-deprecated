import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseConfirmPage } from "../prise-confirm/prise-confirm";
import { MenuPage } from "../../menu/menu";
import { Article } from "../../../app/entities/article";
import { Emplacement } from "../../../app/entities/emplacement";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import {StockageMenuPage} from "../stockage-menu/stockage-menu";
import {Prise} from "../../../app/entities/prise";


@IonicPage()
@Component({
  selector: 'page-prise-articles',
  templateUrl: 'prise-articles.html',
})
export class PriseArticlesPage {

  emplacement: Emplacement;
  articles: Array<Article>;

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
    for (let article of this.articles) {
      let prise = new Prise();
      prise = {
        id: null,
        id_article: article.id,
        quantite: article.quantite,
        date_prise: new Date(),
        id_emplacement_prise: this.emplacement.id
      }

      this.sqliteProvider.insert('prise', prise)
          .then(() => {
            console.log('prise enregistrée');
          })
    } //TODO CG prévoir insert many
    this.navCtrl.push(StockageMenuPage)
        .then(() => this.showToast('Prise enregistrée.'));

  }

  // Helper
  async showToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'center'
    });
    toast.present();
  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

}
