import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { EntreeFlashPage } from './entree-flash.page';

const routes: Routes = [
  {
    path: '',
    component: EntreeFlashPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [EntreeFlashPage]
})
export class EntreeFlashPageModule {}
