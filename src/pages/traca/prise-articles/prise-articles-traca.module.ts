import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PriseArticlesPageTraca } from './prise-articles-traca';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    PriseArticlesPageTraca,
  ],
    imports: [
        IonicPageModule.forChild(PriseArticlesPageTraca),
        HelpersModule,
    ],
})
export class PriseArticlesPageModule {}
