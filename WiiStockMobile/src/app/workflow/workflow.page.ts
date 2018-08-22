import { Component, OnInit } from '@angular/core';
import { ItemModel } from '../../model/item';

@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.page.html',
  styleUrls: ['./workflow.page.scss'],
})
export class WorkflowPage implements OnInit {
  
  ordres: ItemModel[] = [];

  constructor() { 
  	for (let i = 1; i < 10; i++) {
  		let ordre = new ItemModel("Type "+ i, "Auteur "+ i, "01/0"+i+"/2018");
  		this.ordres.push(ordre);
  	}
  }

  ngOnInit() {
  }

}
