import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-entree-recapitulatif',
  templateUrl: './entree-recapitulatif.page.html',
  styleUrls: ['./entree-recapitulatif.page.scss'],
})
export class EntreeRecapitulatifPage implements OnInit {
  private selectedItem: any;
  public items: Array<{ title: string; button_state: boolean }> = [];
  constructor() {
    for (let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Entrée ' + i,
        button_state: ((Math.floor(Math.random() * 2)) == 1) ? true : false,
      });
    }
  }

  ngOnInit() {
  }

}
