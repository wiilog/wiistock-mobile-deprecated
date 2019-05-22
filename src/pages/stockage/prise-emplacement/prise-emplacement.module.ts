import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PriseEmplacementPage } from './prise-emplacement';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

@NgModule({
  declarations: [
    PriseEmplacementPage,
  ],
  imports: [
    IonicPageModule.forChild(PriseEmplacementPage),
  ],
  providers: [
    BarcodeScanner
  ]
})
export class PriseEmplacementPageModule {}
