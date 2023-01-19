import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchWaybillRoutingModule} from './dispatch-waybill-routing.module';
import {DispatchWaybillPage} from './dispatch-waybill.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchWaybillRoutingModule,
        CommonModule
    ],
    declarations: [DispatchWaybillPage]
})
export class DispatchWaybillPageModule {
}
