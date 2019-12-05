import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LivraisonMenuPage } from './livraison-menu';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    LivraisonMenuPage,
  ],
    imports: [
        IonicPageModule.forChild(LivraisonMenuPage),
        HelpersModule,
    ],
})
export class LivraisonMenuPageModule {}
