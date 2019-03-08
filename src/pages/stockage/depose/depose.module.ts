import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeposePage } from './depose';

@NgModule({
  declarations: [
    DeposePage,
  ],
  imports: [
    IonicPageModule.forChild(DeposePage),
  ],
})
export class DeposePageModule {}
