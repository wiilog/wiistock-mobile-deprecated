import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {PriseArticlesPage} from "../prise-articles/prise-articles";


/**
 * Generated class for the PriseConfirmPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-prise-confirm',
  templateUrl: 'prise-confirm.html',
})
export class PriseConfirmPage {

  ref: string;
  quantity: number;
  articles: Array<{ref: string, quantity: number}>;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.ref = '';
    this.quantity = 1;

    this.articles = navParams.get('articles');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PriseConfirmPage');
  }

  addArticle() {
      let article = {ref: this.ref, quantity: this.quantity};

      if (typeof(this.articles) !== 'undefined') {
          this.articles.push(article);
      } else {
          this.articles = [article];
      }

      this.navCtrl.push(PriseArticlesPage, {
          articles: this.articles
      });
  }

}
