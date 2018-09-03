import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TransfertAddPage } from './transfert-add';

@NgModule({
  declarations: [
    TransfertAddPage,
  ],
  imports: [
    IonicPageModule.forChild(TransfertAddPage),
  ],
})
export class TransfertAddPageModule {}
