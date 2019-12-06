import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {DeposeArticlesPageTraca} from './depose-articles-traca';
import {HelpersModule} from '@helpers/helpers.module';


@NgModule({
    declarations: [
        DeposeArticlesPageTraca,
    ],
    imports: [
        IonicPageModule.forChild(DeposeArticlesPageTraca),
        HelpersModule,
    ],
})
export class DeposeArticlesPageModule {
}
