import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { TestApiProvider } from '../../providers/test-api/test-api';

/**
 * Generated class for the ListPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-list',
  templateUrl: 'list.html',
  providers: [[TestApiProvider]]
})
export class ListPage {
  
  public tests: Array<{ title: string; release_date: string; track_count: number }> = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, public api: TestApiProvider, public loadinController: LoadingController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ListPage');
    this.getTest();
  }

  async getTest() {
    const loading = await this.loadinController.create({
      content: 'Loading'
    });

    await loading.present();
    await this.api.getTest().subscribe(res => {
      console.log(res);
      this.tests = res;
      loading.dismiss();
    }, err => {
      console.log(err);
      loading.dismiss();
    });
  }

}
