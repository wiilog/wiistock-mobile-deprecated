import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManualDeliveryPageRoutingModule} from './manual-delivery-routing.module';
import {ManualDeliveryPage} from './manual-delivery.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManualDeliveryPageRoutingModule,
        CommonModule
    ],
    declarations: [ManualDeliveryPage]
})
export class ManualDeliveryPageModule {
}
