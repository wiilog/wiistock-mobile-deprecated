import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CollecteMenuPage } from './collecte-menu';

@NgModule({
  declarations: [
    CollecteMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(CollecteMenuPage),
  ],
})
export class CollecteMenuModule {}
