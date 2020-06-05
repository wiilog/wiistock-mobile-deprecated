import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {StockMenuPageRoutingModule} from './stock-menu-routing.module';
import {StockMenuPage} from './stock-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        StockMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [StockMenuPage]
})
export class StockMenuPageModule {
}
