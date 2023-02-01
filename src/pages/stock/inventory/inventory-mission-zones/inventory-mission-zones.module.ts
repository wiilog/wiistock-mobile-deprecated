import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {InventoryMissionZonesPageRoutingModule} from './inventory-mission-zones-routing.module';
import {InventoryMissionZonesPage} from './inventory-mission-zones.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        InventoryMissionZonesPageRoutingModule,
        CommonModule
    ],
    declarations: [InventoryMissionZonesPage]
})
export class InventoryMissionZonesPageModule {
}
