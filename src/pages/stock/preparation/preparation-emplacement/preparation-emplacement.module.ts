import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PreparationEmplacementPage} from './preparation-emplacement';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
    declarations: [
        PreparationEmplacementPage,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(PreparationEmplacementPage),
    ],
})
export class PreparationEmplacementPageModule {
}
