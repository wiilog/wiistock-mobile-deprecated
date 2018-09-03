import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReceptionAddPage } from './reception-add';

@NgModule({
  declarations: [
    ReceptionAddPage,
  ],
  imports: [
    IonicPageModule.forChild(ReceptionAddPage),
  ],
})
export class ReceptionAddPageModule {}
