import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {InventoryLocationsPage} from './inventory-locations';
import {HelpersModule} from '@helpers/helpers.module';

@NgModule({
    declarations: [
        InventoryLocationsPage,
    ],
    imports: [
        IonicPageModule.forChild(InventoryLocationsPage),
        HelpersModule,
    ],
})
export class InventoryLocationsPageModule {
}
