import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { TransfertRecapitulatifPage } from './transfert-recapitulatif.page';

const routes: Routes = [
  {
    path: '',
    component: TransfertRecapitulatifPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [TransfertRecapitulatifPage]
})
export class TransfertRecapitulatifPageModule {}
