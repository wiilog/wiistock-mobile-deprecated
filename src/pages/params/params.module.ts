import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ParamsPage } from './params';

@NgModule({
  declarations: [
    ParamsPage,
  ],
  imports: [
    IonicPageModule.forChild(ParamsPage),
  ],
})
export class ParamsPageModule {}
