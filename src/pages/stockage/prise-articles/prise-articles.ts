import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import {PriseConfirmPage} from "../prise-confirm/prise-confirm";
import {SousMenuPage} from "../../sous-menu/sous-menu";
import {DeposePage} from "../depose/depose";
import {PriseEmplacementPage} from "../prise-emplacement/prise-emplacement";
import {MenuPage} from "../../menu/menu";
import { StorageService, Mouvement } from "../../../app/services/storage.service";

/**
 * Generated class for the PriseArticlesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-prise-articles',
  templateUrl: 'prise-articles.html',
})
export class PriseArticlesPage {

  location: string;
  articles: Array<{ref: string, quantity: number}>;
  mouvement: Mouvement = <Mouvement>{};

  constructor(public navCtrl: NavController, public navParams: NavParams, private toastController: ToastController, private storageService: StorageService) {
    if (typeof(navParams.get('location')) !== undefined) {
      this.location = navParams.get('location');
    }

    if (typeof(navParams.get('articles')) !== undefined) {
      this.articles = navParams.get('articles');
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PriseArticlesPage');
  }

  addArticleManually() {
    this.navCtrl.push(PriseConfirmPage, {
      articles: this.articles
    });
  }

  finishTaking() {
    this.mouvement.id = Date.now();
    this.mouvement.type = 'prise';
    this.mouvement.emplacement = this.location;

    this.storageService.addMouvement(this.mouvement).then(mouvement => {
      this.mouvement = <Mouvement>{};
      // this.showToast('Mouvement ajouté !');
    })

    let item = {title: 'Stockage', icon: 'flask', funcs: [
      {label: 'prise', page: PriseEmplacementPage, icon: 'cloud-download'},
      {label: 'dépose', page: DeposePage, icon: 'cloud-upload'}
    ]}; // TODO CG trouver autre système
    this.navCtrl.push(SousMenuPage, {item : item});
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
