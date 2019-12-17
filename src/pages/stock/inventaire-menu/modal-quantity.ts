import {Component, ViewChild} from '@angular/core';
import {TextInput, ViewController} from 'ionic-angular';


@Component({
    templateUrl: 'modal-quantity.html',
})
export class ModalQuantityPage {
    @ViewChild('inputQuantity')
    public inputQuantity: TextInput;

    public quantity: number;

    public constructor(private viewCtrl: ViewController) {}

    public dismiss(): void {
        if (this.quantity) {
            let data = {quantity: this.quantity};
            this.viewCtrl.dismiss(data);
        }
    }

    public ionViewDidLoad(): void {
        this.inputQuantity.setFocus();
    }
}

