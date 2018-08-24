import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { PreparationFlashPage } from './preparation-flash.page';

const routes: Routes = [
  {
    path: '',
    component: PreparationFlashPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [PreparationFlashPage]
})
export class PreparationFlashPageModule {}
