import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { EntreeFlashPage } from '../entree-flash/entree-flash';
import { SortieFlashPage } from '../sortie-flash/sortie-flash';
import { WorkflowPage } from '../workflow/workflow';
import { InventoryListPage } from '../inventory-list/inventory-list';

/**
 * Generated class for the HomePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  pages: any;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  	this.pages = {
  		entree: EntreeFlashPage,
  		sortie: SortieFlashPage,
  		workflow: WorkflowPage,
  		inventaire: InventoryListPage
  	}

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomePage');
  }

  openPage(page) {
  	this.navCtrl.push(page);
  }

}
