import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';
import {TruckArrivalDriverPage} from '@pages/tracking/truck-arrival/truck-arrival-driver/truck-arrival-driver.page';
import {TruckArrivalDriverRoutingModule} from '@pages/tracking/truck-arrival/truck-arrival-driver/truck-arrival-driver-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TruckArrivalDriverRoutingModule,
        CommonModule
    ],
    declarations: [TruckArrivalDriverPage]
})
export class TruckArrivalDriverPageModule {
}
