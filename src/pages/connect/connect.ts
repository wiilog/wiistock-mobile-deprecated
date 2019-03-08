import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UsersApiProvider } from "../../providers/users-api/users-api";
import { MenuPage } from "../menu/menu";
// import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

@Component({
  selector: 'page-connect',
  templateUrl: 'connect.html',
})
export class ConnectPage {

  form = {
    login: '',
    password: ''
  };
  errorMsg: string = '';
  currentUser = {
    'login': '',
    'role': ''
  };

  // constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider, private sqlite: SQLite) {
  constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConnectPage');
  }

  logForm() {
    this.navCtrl.push(MenuPage);

    this.usersApiProvider.setProvider(this.form).subscribe(data => {
      console.log(data);
      this.currentUser = data;

      this.navCtrl.push(MenuPage);
    });
  }

  checkPassword() {
    let nbChar = this.form.password.length;
    this.errorMsg = nbChar < 8 ? 'Le message doit faire au moins 8 caractères.' : '';
  }

  // connectToDb() {
  //   this.sqlite.create({
  //     name: 'stock.db',
  //     location: 'default'
  //   })
  //       .then((db: SQLiteObject) => {
  //
  //         db.executeSql('create table mouvements(name VARCHAR(32))', [])
  //             .then(() => console.log('Executed SQL'))
  //             .catch(e => console.log(e));
  //
  //       })
  //       .catch(e => console.log(e));
  // }

}
