import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ParamsPage } from './params';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    ParamsPage,
  ],
    imports: [
        IonicPageModule.forChild(ParamsPage),
        HelpersModule,
    ],
})
export class ParamsPageModule {}
