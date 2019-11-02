import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {CollecteEmplacementPage} from '@pages/collecte/collecte-emplacement/collecte-emplacement';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        CollecteEmplacementPage,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(CollecteEmplacementPage),
    ],
})
export class CollecteEmplacementModule {
}
