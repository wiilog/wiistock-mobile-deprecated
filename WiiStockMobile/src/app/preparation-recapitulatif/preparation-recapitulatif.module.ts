import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PreparationRecapitulatifPage } from './preparation-recapitulatif.page';

const routes: Routes = [
  {
    path: '',
    component: PreparationRecapitulatifPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreparationRecapitulatifPage]
})
export class PreparationRecapitulatifPageModule {}
