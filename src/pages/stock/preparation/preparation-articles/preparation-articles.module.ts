import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PreparationArticlesPage } from './preparation-articles';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    PreparationArticlesPage,
  ],
    imports: [
        IonicPageModule.forChild(PreparationArticlesPage),
        HelpersModule,
    ],
})
export class PreparationArticlesPageModule {}
