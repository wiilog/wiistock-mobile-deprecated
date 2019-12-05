import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DeposePage} from './depose';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        DeposePage,
    ],
    imports: [
        IonicPageModule.forChild(DeposePage),
        HelpersModule,
    ],
})
export class DeposePageModule {
}
