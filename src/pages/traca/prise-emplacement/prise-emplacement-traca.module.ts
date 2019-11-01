import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PriseEmplacementPageTraca} from './prise-emplacement-traca';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        PriseEmplacementPageTraca,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(PriseEmplacementPageTraca)
    ]
})
export class PriseEmplacementPageModule {
}
