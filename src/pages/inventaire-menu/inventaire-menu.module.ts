import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InventaireMenuPage } from './inventaire-menu';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    InventaireMenuPage,
  ],
    imports: [
        IonicPageModule.forChild(InventaireMenuPage),
        HelpersModule,
    ],
})
export class InventaireMenuPageModule {}
