import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {InventoryArticlePage} from './inventory-article';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        InventoryArticlePage,
    ],
    imports: [
        IonicPageModule.forChild(InventoryArticlePage),
        HelpersModule,
    ],
})
export class InventoryArticlePageModule {
}
