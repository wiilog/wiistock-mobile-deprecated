import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {StockMenuPage} from "@pages/stock/stock-menu/stock-menu";


@NgModule({
    declarations: [
        StockMenuPage,
    ],
    imports: [
        IonicPageModule.forChild(StockMenuPage)
    ],
})
export class StockMenuModule {
}
