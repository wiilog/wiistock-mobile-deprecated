import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseConfirmPage } from "../prise-confirm/prise-confirm";
import { MenuPage } from "../../menu/menu";
import { Article } from "../../../app/entities/article";
import { Emplacement } from "../../../app/entities/emplacement";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import {StockageMenuPage} from "../stockage-menu/stockage-menu";
import { Mouvement } from '../../../app/entities/mouvement';


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
      console.log(this.sqliteProvider.findAll('article'));
      let mouvement = new Mouvement();
      let date = new Date().toISOString();
      mouvement = {
        id: null,
        id_article: article.id,
        quantite: article.quantite,
        date_prise: date,
        id_emplacement_prise: this.emplacement.id,
        date_depose: null,
        id_emplacement_depose: null,
        type: 'prise-depose'
      };
      console.log(mouvement);

      this.sqliteProvider.executeQuery(
        'INSERT INTO mouvement (id_article, quantite, date_prise, id_emplacement_prise, date_depose, id_emplacement_depose, type) VALUES (66, 2, "2019-05-21T15:54:03.021Z", 54, null, null, "prise-depose")')
          .then(() => {
              console.log('prise enregistrée !');
          })
      // this.sqliteProvider.insert('mouvement', mouvement)
      //     .then(() => {
      //       console.log('prise enregistrée');
      //     })
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
