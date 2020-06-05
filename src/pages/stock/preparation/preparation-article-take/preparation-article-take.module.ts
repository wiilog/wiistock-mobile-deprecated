import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PreparationArticleTakePageRoutingModule} from './preparation-article-take-routing.module';
import {PreparationArticleTakePage} from './preparation-article-take.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PreparationArticleTakePageRoutingModule,
        CommonModule
    ],
    declarations: [PreparationArticleTakePage]
})
export class PreparationArticleTakePageModule {
}
