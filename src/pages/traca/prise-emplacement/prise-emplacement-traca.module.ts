import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PriseEmplacementPageTraca} from './prise-emplacement-traca';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import { IonicSelectableModule } from 'ionic-selectable'

@NgModule({
    declarations: [
        PriseEmplacementPageTraca,
    ],
    imports: [
        IonicSelectableModule,
        IonicPageModule.forChild(PriseEmplacementPageTraca),
    ],
    providers: [
        BarcodeScanner
    ]
})
export class PriseEmplacementPageModule {
}
