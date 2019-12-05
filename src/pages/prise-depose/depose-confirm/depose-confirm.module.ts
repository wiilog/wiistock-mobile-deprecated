import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DeposeConfirmPage} from './depose-confirm';
import {HelpersModule} from "@helpers/helpers.module";


@NgModule({
    declarations: [
        DeposeConfirmPage
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(DeposeConfirmPage)
    ],
})
export class DeposeConfirmPageModule {
}
