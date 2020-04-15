import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { LivraisonArticlesPage } from './livraison-articles';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    LivraisonArticlesPage,
  ],
    imports: [
        IonicPageModule.forChild(LivraisonArticlesPage),
        HelpersModule,
    ],
})
export class LivraisonArticlesPageModule {}
