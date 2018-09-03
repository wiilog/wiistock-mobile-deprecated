import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { PreparationFlashPage } from '../preparation-flash/preparation-flash';
import { ArticleModel } from '../../model/item';

/**
 * Generated class for the OrdreDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-ordre-detail',
  templateUrl: 'ordre-detail.html',
})
export class OrdreDetailPage {
  selectedOrdre: { type: {text: string, color: string}, auteur: string, date: string };
  articles: ArticleModel[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 5; i++) {
  		let article = new ArticleModel("Article "+ i, "A"+i+"/T"+(i-1)+"/R"+(i+2)+"/E"+i, Math.floor(Math.random()*3+1));
  		this.articles.push(article);
  	}

    this.selectedOrdre = this.navParams.data;

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OrdreDetailPage');
  }

  closePage() {
  	this.navCtrl.pop();
  }

  openPage() {
    this.navCtrl.push(PreparationFlashPage);
  }

}
