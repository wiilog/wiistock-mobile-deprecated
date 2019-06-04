import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {BarcodeScanner} from '@ionic-native/barcode-scanner';
import { IonicSelectableModule } from 'ionic-selectable'
import {DeposeEmplacementPageTraca} from "./depose-emplacement-traca";

@NgModule({
    declarations: [
        DeposeEmplacementPageTraca,
    ],
    imports: [
        IonicSelectableModule,
        IonicPageModule.forChild(DeposeEmplacementPageTraca),
    ],
    providers: [
        BarcodeScanner
    ]
})
export class PriseEmplacementPageModule {
}
