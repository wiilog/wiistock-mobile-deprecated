import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-reception-recapitulatif',
  templateUrl: './reception-recapitulatif.page.html',
  styleUrls: ['./reception-recapitulatif.page.scss'],
})
export class ReceptionRecapitulatifPage implements OnInit {

  private selectedItem: any;
  public items: Array<{ title: string; button_state: boolean }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Réception ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }


  ngOnInit() {
  }

}
