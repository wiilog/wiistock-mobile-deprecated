import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PreparationMenuPage } from './preparation-menu';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    PreparationMenuPage,
  ],
    imports: [
        IonicPageModule.forChild(PreparationMenuPage),
        HelpersModule,
    ],
})
export class PreparationMenuPageModule {}
