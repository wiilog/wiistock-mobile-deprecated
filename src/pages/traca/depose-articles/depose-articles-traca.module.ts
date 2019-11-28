import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeposeArticlesPageTraca } from './depose-articles-traca';
import {ComponentsModule} from "../../../components/components.module";

@NgModule({
  declarations: [
    DeposeArticlesPageTraca,
  ],
    imports: [
        IonicPageModule.forChild(DeposeArticlesPageTraca),
        ComponentsModule,
    ],
})
export class DeposeArticlesPageModule {}
