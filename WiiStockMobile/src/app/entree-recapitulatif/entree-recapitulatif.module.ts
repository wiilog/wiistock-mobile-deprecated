import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EntreeRecapitulatifPage } from './entree-recapitulatif.page';

const routes: Routes = [
  {
    path: '',
    component: EntreeRecapitulatifPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [EntreeRecapitulatifPage]
})
export class EntreeRecapitulatifPageModule {}
