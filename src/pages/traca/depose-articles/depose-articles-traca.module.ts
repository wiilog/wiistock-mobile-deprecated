import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeposeArticlesPageTraca } from './depose-articles-traca';

@NgModule({
  declarations: [
    DeposeArticlesPageTraca,
  ],
  imports: [
    IonicPageModule.forChild(DeposeArticlesPageTraca),
  ],
})
export class DeposeArticlesPageModule {}
