import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {LivraisonArticleTakePage} from '@pages/stock/livraison/livraison-article-take/livraison-article-take';

@NgModule({
    declarations: [
        LivraisonArticleTakePage,
    ],
    imports: [
        IonicPageModule.forChild(LivraisonArticleTakePage),
    ],
})
export class LivraisonArticleTakePageModule {
}
