import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PreparationAddPage } from './preparation-add';

@NgModule({
  declarations: [
    PreparationAddPage,
  ],
  imports: [
    IonicPageModule.forChild(PreparationAddPage),
  ],
})
export class PreparationAddPageModule {}
