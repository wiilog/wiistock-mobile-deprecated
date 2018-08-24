import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ReceptionFlashPage } from './reception-flash.page';

const routes: Routes = [
  {
    path: '',
    component: ReceptionFlashPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ReceptionFlashPage]
})
export class ReceptionFlashPageModule {}
