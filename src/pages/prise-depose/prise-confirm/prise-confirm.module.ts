import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PriseConfirmPage} from './prise-confirm';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        PriseConfirmPage
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(PriseConfirmPage)
    ],
})
export class PriseConfirmPageModule {
}
