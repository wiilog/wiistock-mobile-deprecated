import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SortieFlashPage } from './sortie-flash';

@NgModule({
  declarations: [
    SortieFlashPage,
  ],
  imports: [
    IonicPageModule.forChild(SortieFlashPage),
  ],
})
export class SortieFlashPageModule {}
