import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PreparationRefArticlesPage} from './preparation-ref-articles';
import {IonicSelectableModule} from "ionic-selectable";

@NgModule({
    declarations: [
        PreparationRefArticlesPage,
    ],
    imports: [
        IonicSelectableModule,
        IonicPageModule.forChild(PreparationRefArticlesPage),
    ],
})
export class PreparationArticlesPageModule {
}
