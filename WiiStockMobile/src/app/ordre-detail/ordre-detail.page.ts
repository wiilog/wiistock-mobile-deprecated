import { Component, OnInit } from '@angular/core';
import { ArticleModel } from '../../model/item';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-ordre-detail',
  templateUrl: './ordre-detail.page.html',
  styleUrls: ['./ordre-detail.page.scss'],
})
export class OrdreDetailPage implements OnInit {

	articles: ArticleModel[] = [];

  constructor(public navCtrl: NavController) { 
  	for (let i = 1; i < 5; i++) {
  		let article = new ArticleModel("Article "+ i, "A"+i+"/T"+(i-1)+"/R"+(i+2)+"/E"+i, Math.floor(Math.random()*3+1));
  		this.articles.push(article);
  	}
  }

  ngOnInit() {
  }

  closePage() {
  	this.navCtrl.goBack("/workflow");
  }

  openPage() {
    this.navCtrl.goForward("/preparation_camera");
  }
}
