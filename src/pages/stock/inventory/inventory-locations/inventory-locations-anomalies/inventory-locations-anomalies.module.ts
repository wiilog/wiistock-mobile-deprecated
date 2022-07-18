import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryLocationsAnomaliesPageRoutingModule} from './inventory-locations-anomalies-routing.module';
import {InventoryLocationsAnomaliesPage} from './inventory-locations-anomalies.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryLocationsAnomaliesPageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryLocationsAnomaliesPage]
})
export class InventoryLocationsAnomaliesPageModule {
}
