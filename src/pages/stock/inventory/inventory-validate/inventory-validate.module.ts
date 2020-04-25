import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PreparationArticleTakePage} from '@pages/stock/preparation/preparation-article-take/preparation-article-take';

@NgModule({
    declarations: [
        PreparationArticleTakePage,
    ],
    imports: [
        IonicPageModule.forChild(PreparationArticleTakePage),
    ],
})
export class PreparationArticleTakePageModule {
}
