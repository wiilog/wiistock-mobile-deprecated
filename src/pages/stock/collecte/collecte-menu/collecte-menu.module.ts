import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {CollecteMenuPage} from '@pages/stock/collecte/collecte-menu/collecte-menu';
import {HelpersModule} from '@helpers/helpers.module';

@NgModule({
    declarations: [
        CollecteMenuPage,
    ],
    imports: [
        HelpersModule,
        IonicPageModule.forChild(CollecteMenuPage),
    ],
})
export class CollecteMenuModule {
}
