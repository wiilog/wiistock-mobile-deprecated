import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DeposeConfirmPageTraca} from './depose-confirm-traca';
import {HelpersModule} from "@helpers/helpers.module";


@NgModule({
    declarations: [
        DeposeConfirmPageTraca
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(DeposeConfirmPageTraca)
    ],
})
export class DeposeConfirmPageTracaModule {
}
