import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UsersApiProvider } from "../../providers/users-api/users-api";
import { ListPage } from "../list/list";

@Component({
  selector: 'page-connect',
  templateUrl: 'connect.html',
})
export class ConnectPage {

  form = {
    login: '',
    password: ''
  };
  errorMsg = '';
  currentUser = {
    'login': '',
    'role': ''
  };

  constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConnectPage');
  }

  logForm() {
    this.usersApiProvider.setProvider(this.form).subscribe(data => {
      this.currentUser = data;
      console.log(this.currentUser);
      this.navCtrl.push(ListPage);
    });
  }

  checkPassword() {
    let nbChar = this.form.password.length;
    this.errorMsg = nbChar < 8 ? 'Le message doit faire au moins 8 caractères.' : '';
  }

}
