import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CollecteArticlesPage } from './collecte-articles';

@NgModule({
  declarations: [
    CollecteArticlesPage,
  ],
  imports: [
    IonicPageModule.forChild(CollecteArticlesPage),
  ],
})
export class CollecteArticlesModule {}
