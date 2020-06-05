import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ParamsPageRoutingModule} from './params-routing.module';
import {ParamsPage} from './params.page';
import {CommonModule} from '@app/common/common.module';


@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ParamsPageRoutingModule,
        CommonModule
    ],
    declarations: [ParamsPage]
})
export class ParamsPageModule {
}
