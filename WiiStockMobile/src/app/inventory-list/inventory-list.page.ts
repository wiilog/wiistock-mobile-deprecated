import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.page.html',
  styleUrls: ['./inventory-list.page.scss'],
})
export class InventoryListPage implements OnInit {
  private selectedItem: any;
  public inventaires: Array<{ nom: string; type: string; date: string; percent: number }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.inventaires.push({
        nom: 'Inventaire ' + i,
        type: ((Math.floor(Math.random() * 2)) == 1) ? 'Tournant' : 'Annuel',
        date: (Math.floor(Math.random() * 12) + 1) + '/' + (Math.floor(Math.random() * 30) + 1) + '/' + (Math.floor(Math.random() * 50) + 2000),
        percent: Math.floor(Math.random() * 100),
      });
    }
  }
  ngOnInit() {
  }

}
