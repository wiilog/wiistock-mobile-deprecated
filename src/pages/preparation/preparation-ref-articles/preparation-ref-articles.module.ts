import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PreparationRefArticlesPage} from './preparation-ref-articles';

@NgModule({
    declarations: [
        PreparationRefArticlesPage,
    ],
    imports: [
        IonicPageModule.forChild(PreparationRefArticlesPage),
    ],
})
export class PreparationArticlesPageModule {
}
