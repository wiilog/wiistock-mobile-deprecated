import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-sortie-recapitulatif',
  templateUrl: './sortie-recapitulatif.page.html',
  styleUrls: ['./sortie-recapitulatif.page.scss'],
})
export class SortieRecapitulatifPage implements OnInit {

  private selectedItem: any;
  public items: Array<{ title: string; button_state: boolean }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Sortie ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ngOnInit() {
  }

}
