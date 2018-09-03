import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OrdreDetailPage } from './ordre-detail';

@NgModule({
  declarations: [
    OrdreDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(OrdreDetailPage),
  ],
})
export class OrdreDetailPageModule {}
