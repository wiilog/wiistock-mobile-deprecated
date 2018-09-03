import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SortieAddPage } from './sortie-add';

@NgModule({
  declarations: [
    SortieAddPage,
  ],
  imports: [
    IonicPageModule.forChild(SortieAddPage),
  ],
})
export class SortieAddPageModule {}
