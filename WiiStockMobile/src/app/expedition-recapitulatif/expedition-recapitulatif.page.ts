import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-expedition-recapitulatif',
  templateUrl: './expedition-recapitulatif.page.html',
  styleUrls: ['./expedition-recapitulatif.page.scss'],
})
export class ExpeditionRecapitulatifPage implements OnInit {

  private selectedItem: any;
  public items: Array<{ title: string; button_state: boolean }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Préparation ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ngOnInit() {
  }

}
