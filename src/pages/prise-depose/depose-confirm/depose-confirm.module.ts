import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {DeposeConfirmPageRoutingModule} from './depose-confirm-routing.module';
import {DeposeConfirmPage} from './depose-confirm.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        DeposeConfirmPageRoutingModule,
        CommonModule
    ],
    declarations: [DeposeConfirmPage]
})
export class DeposeConfirmPageModule {
}
