import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseConfirmPageTraca } from "../prise-confirm/prise-confirm-traca";
import { MenuPage } from "../../menu/menu";
import { Article } from "../../../app/entities/article";
import { Emplacement } from "../../../app/entities/emplacement";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import { StockageMenuPageTraca } from "../stockage-menu/stockage-menu-traca";
import { Mouvement } from '../../../app/entities/mouvement';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ChangeDetectorRef } from '@angular/core';
import {MouvementTraca} from "../../../app/entities/mouvementTraca";


@IonicPage()
@Component({
  selector: 'page-prise-articles',
  templateUrl: 'prise-articles-traca.html',
})
export class PriseArticlesPageTraca {

  emplacement: Emplacement;
  articles: Array<Article>;
  db_articles: Array<Article>;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private toastController: ToastController,
    private sqliteProvider: SqliteProvider,
    private barcodeScanner: BarcodeScanner,
    private changeDetectorRef: ChangeDetectorRef) {
    this.db_articles = this.sqliteProvider.findAll('article');
    if (typeof (navParams.get('emplacement')) !== undefined) {
      this.emplacement = navParams.get('emplacement');
    }

    if (typeof (navParams.get('articles')) !== undefined) {
      this.articles = navParams.get('articles');
    }
    let instance = this;
    (<any>window).plugins.intentShim.registerBroadcastReceiver({
      filterActions: [
        'io.ionic.starter.ACTION'
      ],
      filterCategories: [
        'android.intent.category.DEFAULT'
      ]
    },
      function (intent) {
        instance.testIfBarcodeEquals(intent.extras['com.symbol.datawedge.data_string']);
      });
  }

  addArticleManually() {
    this.navCtrl.push(PriseConfirmPageTraca, {
      articles: this.articles, emplacement: this.emplacement
    });
  }

  finishTaking() {

    for (let article of this.articles) {
      let mouvement = new MouvementTraca();
      let date = new Date().toISOString();
      mouvement = {
        id: null,
        ref_article: article.reference,
        quantite: article.quantite,
        date_prise: date,
        ref_emplacement_prise: this.emplacement.label,
        date_depose: null,
        ref_emplacement_depose: null,
        type: 'prise-depose'
      };
      if (this.articles.indexOf(article) === this.articles.length - 1) {
        this.sqliteProvider.insert('`mouvement_traca`', mouvement).then(() => {
          this.redirectAfterTake();
        });
      } else {
        this.sqliteProvider.insert('`mouvement_traca`', mouvement);
      }
    }

    //   });
  }

  redirectAfterTake() {
    this.navCtrl.push(StockageMenuPageTraca)
      .then(() => {
        this.showToast('Prise enregistrée.')
      });
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

  scan() {
    this.barcodeScanner.scan().then(res => {
      this.testIfBarcodeEquals(res.text);
    });
  }

  testIfBarcodeEquals(text) {
    let found = false;
    console.log(text);
    this.db_articles.forEach(article => {
      console.log(article['reference']);
      if (article['reference'] === text && !found) {
        found = true;
        this.navCtrl.push(PriseConfirmPageTraca, {
          articles: this.articles, emplacement: this.emplacement, selectedArticle: article
        });
      }
    });
    if (!found) {
      this.toastController.create({
        message: 'Aucun article ne correspond à l\'article scanné',
        duration: 3000,
        position: 'center',
        cssClass: 'toast-error'
      }).present();
    }
    this.changeDetectorRef.detectChanges();
  }

}
