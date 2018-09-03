import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { OrdreDetailPage } from '../ordre-detail/ordre-detail';
import { ItemModel } from '../../model/item';

/**
 * Generated class for the WorkflowPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-workflow',
  templateUrl: 'workflow.html',
})
export class WorkflowPage {
  ordres: ItemModel[] = [];
  types: {color: string, text: string}[] = [
    {color: "entree", text: "Entrée"},
    {color: "sortie", text: "Sortie"},
    {color: "transfert", text: "Transfert"},
    {color: "reception", text: "Réception"},
    {color: "preparation", text: "Préparation"}
  ];

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	for (let i = 1; i < 10; i++) {
      let type = this.types[Math.floor(Math.random() * this.types.length)];
  		let ordre = new ItemModel(type, "Auteur "+ i, "05/0"+i+"/2018");
  		this.ordres.push(ordre);
  	}
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad WorkflowPage');
  }

  openPage(ordre) {
    this.navCtrl.push(OrdreDetailPage, ordre);
  }

  /*filterOrdre(values) {
    var cards = document.querySelectorAll("ion-card") as HTMLCollectionOf<HTMLElement>;
    console.log(cards[0]);
    
    for (let i = 0; i < cards.length; i++) {
      console.log(cards[i].querySelector("h1").textContent);
      if (!values.includes(cards[i].querySelector("h1").textContent)) {
        cards[i].style.setProperty("display", "none");
      }
    }

  }*/

  
 
}
