import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EmplacementScanPage } from './emplacement-scan';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    EmplacementScanPage,
  ],
    imports: [
        IonicPageModule.forChild(EmplacementScanPage),
        HelpersModule,
    ],
})
export class EmplacementScanPageModule {}
