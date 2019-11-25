import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ConnectPage} from '@pages/connect/connect';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
    declarations: [ConnectPage],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(ConnectPage),
    ],
})
export class ConnectModule {
}
