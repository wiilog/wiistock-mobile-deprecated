import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DeposeEmplacementPageTraca} from '@pages/traca/depose-emplacement/depose-emplacement-traca';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        DeposeEmplacementPageTraca,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(DeposeEmplacementPageTraca),
    ],
})
export class PriseEmplacementPageModule {
}
