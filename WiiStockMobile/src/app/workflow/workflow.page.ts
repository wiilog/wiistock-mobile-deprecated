import { Component, OnInit } from '@angular/core';
import { ItemModel } from '../../model/item';
import { NavController } from '@ionic/angular';
import { OrdreDetailPage } from '../ordre-detail/ordre-detail.page';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.page.html',
  styleUrls: ['./workflow.page.scss'],
})
export class WorkflowPage implements OnInit {
  
  ordres: ItemModel[] = [];

  constructor(public navCtrl: NavController) { 
  	for (let i = 1; i < 10; i++) {
  		let ordre = new ItemModel("Type "+ i, "Auteur "+ i, "05/0"+i+"/2018");
  		this.ordres.push(ordre);
  	}
  }

  ngOnInit() {
  }

  openPage() {
    this.navCtrl.goForward('/ordre_detail');
  }

}
