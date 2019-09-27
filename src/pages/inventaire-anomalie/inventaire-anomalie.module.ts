import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InventaireAnomaliePage } from './inventaire-anomalie';

@NgModule({
  declarations: [
    InventaireAnomaliePage,
  ],
  imports: [
    IonicPageModule.forChild(InventaireAnomaliePage),
  ],
})
export class InventaireAnomaliePageModule {}
