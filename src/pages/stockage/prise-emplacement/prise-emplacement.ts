import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { PriseArticlesPage } from "../prise-articles/prise-articles";
import { MenuPage } from "../../menu/menu";
import { Emplacement } from "../../../app/entities/emplacement";
import { Article } from "../../../app/entities/article";
import { SqliteProvider } from "../../../providers/sqlite/sqlite";
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { ChangeDetectorRef } from '@angular/core';
// import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';

@IonicPage()
@Component({
  selector: 'page-prise',
  templateUrl: 'prise-emplacement.html',
})
export class PriseEmplacementPage {

  emplacement: Emplacement;
  id: number;
  // locationLabel = '';
  db_locations: Array<Emplacement>;
  db_articles: Array<Article>;
  result: Article;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public app: App,
    public sqliteProvider: SqliteProvider,
    private barcodeScanner: BarcodeScanner,
    private toast: ToastController,
    private changeDetectorRef: ChangeDetectorRef) {
    // constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
    //   this.scan();

    this.db_locations = this.sqliteProvider.findAll('emplacement');
    this.db_articles = this.sqliteProvider.findAll('article');
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
        let found = false;
        instance.db_articles.forEach(article => {
          if (article['reference'] === intent.extras['com.symbol.datawedge.data_string'] && !found) {
            instance.result = article;
            found = true;
          }
        });
        if (!found) {
          instance.toast.create({
            message: 'Aucun article ne correspond à l\'article scanné',
            duration: 3000,
            position: 'center',
            cssClass: 'toast-error'
          }).present();
        }
        changeDetectorRef.detectChanges();
      });


  }

  // vibrate() {
  //     navigator.vibrate(3000);
  // }

  goToArticles() {
    this.sqliteProvider.findOne('emplacement', this.id).then((emplacement) => {
      this.emplacement = emplacement;
      this.navCtrl.push(PriseArticlesPage, { emplacement: this.emplacement });
    })

  }

  goHome() {
    this.navCtrl.push(MenuPage);
  }

  scan() {
    this.barcodeScanner.scan().then(res => {
      let found = false;
      this.db_articles.forEach(article => {
        if (article['reference'] === res.text && !found) {
          this.result = article;
          found = false;
        }
      });
      if (!found) {
        this.toast.create({
          message: 'Aucun article ne correspond à l\'article scanné',
          duration: 3000,
          position: 'center',
          cssClass: 'toast-error'
        }).present();
      }
      this.changeDetectorRef.detectChanges();
    }).catch(err => {
      this.toast.create({
        message: err.message
      }).present();
    })
  }

}
