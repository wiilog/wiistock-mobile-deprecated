import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {CollecteArticleTakePageRoutingModule} from './collecte-article-take-routing.module';
import {CollecteArticleTakePage} from './collecte-article-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        CollecteArticleTakePageRoutingModule,
        CommonModule
    ],
    declarations: [CollecteArticleTakePage]
})
export class CollecteArticleTakePageModule {
}
