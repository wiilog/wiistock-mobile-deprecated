import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ReceptionRecapitulatifPage } from './reception-recapitulatif.page';

const routes: Routes = [
  {
    path: '',
    component: ReceptionRecapitulatifPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ReceptionRecapitulatifPage]
})
export class ReceptionRecapitulatifPageModule {}
