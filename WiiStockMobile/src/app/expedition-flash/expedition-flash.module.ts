import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ExpeditionFlashPage } from './expedition-flash.page';

const routes: Routes = [
  {
    path: '',
    component: ExpeditionFlashPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ExpeditionFlashPage]
})
export class ExpeditionFlashPageModule {}
