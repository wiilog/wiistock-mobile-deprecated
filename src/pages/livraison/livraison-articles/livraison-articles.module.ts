import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LivraisonArticlesPage } from './livraison-articles';

@NgModule({
  declarations: [
    LivraisonArticlesPage,
  ],
  imports: [
    IonicPageModule.forChild(LivraisonArticlesPage),
  ],
})
export class LivraisonArticlesPageModule {}
