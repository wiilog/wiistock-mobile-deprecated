import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PriseUlDetailsRoutingModule} from './prise-ul-details-routing.module';
import {PriseUlDetails} from './prise-ul-details.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PriseUlDetailsRoutingModule,
        CommonModule
    ],
    declarations: [PriseUlDetails]
})
export class PriseUlDetailsPageModule {
}
