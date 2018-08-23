import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-inventory-view',
  templateUrl: './inventory-view.page.html',
  styleUrls: ['./inventory-view.page.scss'],
})
export class InventoryViewPage implements OnInit {
  private selectedItem: any;
  public inventaire: Array<{ nom: string; ref: string; allee: string; travee: string; rack: string;quantite: number }> = [];
  constructor() {
    for (let i = 1; i < 6; i++) {
      this.inventaire.push({
        nom: 'Item ' + i,
        ref: Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10),
        allee: 'Allée ' + Math.floor(Math.random() * 10),
        travee: 'Travée ' + Math.floor(Math.random() * 20),
        rack: 'Rack ' + Math.floor(Math.random() * 30),
        quantite: 0,
      });
    }
  }
  ngOnInit() {
  }

}
