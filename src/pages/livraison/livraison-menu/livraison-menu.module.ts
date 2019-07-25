import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LivraisonMenuPage } from './livraison-menu';

@NgModule({
  declarations: [
    LivraisonMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(LivraisonMenuPage),
  ],
})
export class LivraisonMenuPageModule {}
