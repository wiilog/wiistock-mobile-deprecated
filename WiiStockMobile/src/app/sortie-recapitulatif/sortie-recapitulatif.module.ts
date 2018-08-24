import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SortieRecapitulatifPage } from './sortie-recapitulatif.page';

const routes: Routes = [
  {
    path: '',
    component: SortieRecapitulatifPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [SortieRecapitulatifPage]
})
export class SortieRecapitulatifPageModule {}
