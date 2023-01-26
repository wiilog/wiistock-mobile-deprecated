import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ArticleCreationRoutingModule} from './article-creation-routing.module';
import {ArticleCreationPage} from './article-creation.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ArticleCreationRoutingModule,
        CommonModule
    ],
    declarations: [ArticleCreationPage]
})
export class ArticleCreationPageModule {
}
