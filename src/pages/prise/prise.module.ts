import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PrisePage } from './prise';

@NgModule({
  declarations: [
    PrisePage,
  ],
  imports: [
    IonicPageModule.forChild(PrisePage),
  ],
})
export class PrisePageModule {}
