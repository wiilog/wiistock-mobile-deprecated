import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CollecteArticlesPage } from './collecte-articles';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    CollecteArticlesPage,
  ],
    imports: [
        IonicPageModule.forChild(CollecteArticlesPage),
        HelpersModule,
    ],
})
export class CollecteArticlesModule {}
