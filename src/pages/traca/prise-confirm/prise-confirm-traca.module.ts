import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PriseConfirmPageTraca } from './prise-confirm-traca';
import {IonicSelectableModule} from "ionic-selectable";

@NgModule({
  declarations: [
    PriseConfirmPageTraca,
  ],
    imports: [
        IonicPageModule.forChild(PriseConfirmPageTraca),
        IonicSelectableModule,
    ],
})
export class PriseConfirmPageModule {}
