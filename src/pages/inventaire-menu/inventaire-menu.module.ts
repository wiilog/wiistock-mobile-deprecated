import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InventaireMenuPage } from './inventaire-menu';

@NgModule({
  declarations: [
    InventaireMenuPage,
  ],
  imports: [
    IonicPageModule.forChild(InventaireMenuPage),
  ],
})
export class InventaireMenuPageModule {}
