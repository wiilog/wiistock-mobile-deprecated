// import { Component } from '@angular/core';
// import { NavController, NavParams } from 'ionic-angular';
// import {MenuPage} from "../menu/menu";
// import {Mouvement, StorageService} from "../../app/services/storage.service";
//
//
// @Component({
//   selector: 'page-sous-menu',
//   templateUrl: 'sous-menu.html'
// })
// export class SousMenuPage {
//   selectedItem: any;
//   mouvements: Mouvement[];
//
//   constructor(public navCtrl: NavController, public navParams: NavParams, private storageService: StorageService) {
//     // If we navigated to this page, we will have an item available as a nav param
//     this.selectedItem = navParams.get('item');
//
//     this.displayMouvements();
//   }
//
//   displayMouvements() {
//     console.log('display mouvements');
//     this.storageService.getMouvements().then(mouvements => {
//       console.log(mouvements);
//       this.mouvements = mouvements;
//     })
//   }
//
//   funcTapped(event, func) {
//     this.navCtrl.push(func.page, {
//       func: func
//     });
//   }
//
//   goHome() {
//     console.log('go home');
//     this.navCtrl.push(MenuPage);
//   }
//
// }
