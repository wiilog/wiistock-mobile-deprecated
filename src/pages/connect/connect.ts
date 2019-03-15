import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { UsersApiProvider } from "../../providers/users-api/users-api";
import { MenuPage } from "../menu/menu";
import { StorageService } from "../../app/services/storage.service";
import {SqliteProvider} from "../../providers/sqlite/sqlite";

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
  constructor(public navCtrl: NavController, public navParams: NavParams, public usersApiProvider: UsersApiProvider, public storageService: StorageService, public sqliteProvider: SqliteProvider) {
  }

  logForm() {
      //TODO à remettre quand API branchée
    // this.usersApiProvider.setProvider(this.form).subscribe(resp => {
    //     console.log(resp);
    //   if (resp.success) {
        // this.sqliteProvider.importData(resp.data);

        this.sqliteProvider.cleanDataBase()
            .then(() => {
              this.sqliteProvider.importData(null)
                  .then(() => {
                    this.navCtrl.push(MenuPage);
                  });
            });
    //   } else {
    //     this.errorMsg = 'Identifiants incorrects.'
    //   }
    // });
  }

  // checkPassword() {
  //   let nbChar = this.form.password.length;
  //   this.errorMsg = nbChar < 8 ? 'Le mot de passe doit faire au moins 8 caractères.' : '';
  // }

}
