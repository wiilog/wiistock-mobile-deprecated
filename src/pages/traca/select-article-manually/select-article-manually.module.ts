import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {SelectArticleManuallyPage} from './select-article-manually';
import {IonicSelectableModule} from 'ionic-selectable';

@NgModule({
    declarations: [
        SelectArticleManuallyPage,
    ],
    imports: [
        IonicPageModule.forChild(SelectArticleManuallyPage),
        IonicSelectableModule,
    ],
})
export class PriseConfirmPageModule {
}
