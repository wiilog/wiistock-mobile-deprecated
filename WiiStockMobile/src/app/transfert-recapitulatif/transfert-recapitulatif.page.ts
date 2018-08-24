import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-transfert-recapitulatif',
  templateUrl: './transfert-recapitulatif.page.html',
  styleUrls: ['./transfert-recapitulatif.page.scss'],
})
export class TransfertRecapitulatifPage implements OnInit {

  private selectedItem: any;
  public items: Array<{ title: string; button_state: boolean }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Transfert ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ngOnInit() {
  }

}
