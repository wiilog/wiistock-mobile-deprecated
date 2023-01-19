import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DispatchFilterRoutingModule} from './dispatch-filter-routing.module';
import {DispatchFilterPage} from './dispatch-filter.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DispatchFilterRoutingModule,
        CommonModule
    ],
    declarations: [DispatchFilterPage]
})
export class DispatchFilterPageModule {
}
