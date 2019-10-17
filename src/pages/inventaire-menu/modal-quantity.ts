import {Component, ViewChild} from '@angular/core';
import {NavParams, ViewController} from "ionic-angular";
import {ArticleInventaire} from "../../app/entities/articleInventaire";

@Component({
    templateUrl: 'modal-quantity.html',
})
export class ModalQuantityPage {
    @ViewChild('inputQuantity') inputQuantity;
    article: ArticleInventaire;
    quantity: number;
    locations: Array<string>;
    location: string;

    constructor(params: NavParams, public viewCtrl: ViewController) {
        this.article = params.data.article;
    }

    dismiss() {
        let data = {quantity: this.quantity};
        this.viewCtrl.dismiss(data);
    }

    ngAfterViewChecked() {
        this.inputQuantity.setFocus();
    }
}

