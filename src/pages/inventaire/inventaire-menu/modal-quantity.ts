import {Component} from '@angular/core';
import {NavParams, ViewController} from "ionic-angular";
import {ArticleInventaire} from "../../../app/entities/articleInventaire";

// import {IonicPage} from 'ionic-angular';


/**
 * Generated class for the InventaireMenuPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

// @IonicPage()
@Component({
    templateUrl: 'modal-quantity.html',
})
export class ModalQuantityPage {
    article: ArticleInventaire;
    quantity: number;

    constructor(params: NavParams, public viewCtrl: ViewController) {
        this.article = params.data.article;
    }

    dismiss() {
        let data = {quantity: this.quantity};
        this.viewCtrl.dismiss(data);
    }
}

