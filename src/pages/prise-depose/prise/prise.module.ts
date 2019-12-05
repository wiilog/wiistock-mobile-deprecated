import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PrisePage} from './prise';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        PrisePage,
    ],
    imports: [
        IonicPageModule.forChild(PrisePage),
        HelpersModule
    ],
})
export class PrisePageModule {
}
