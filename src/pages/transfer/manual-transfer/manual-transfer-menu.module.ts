import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManualTransferMenuPageRoutingModule} from './manual-transfer-menu-routing.module';
import {ManualTransferMenuPage} from './manual-transfer-menu-page.component';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManualTransferMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [ManualTransferMenuPage]
})
export class ManualTransferMenuPageModule {
}
