import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {TransferMenuPageRoutingModule} from './transfer-menu-routing.module';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';
import {TransferMenuPage} from "@pages/stock/transfer/transfer-menu/transfer-menu.page";

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        TransferMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [TransferMenuPage]
})
export class TransferMenuPageModule {
}
