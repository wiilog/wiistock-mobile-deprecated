import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DeposePageTraca } from './depose-traca';

@NgModule({
  declarations: [
    DeposePageTraca,
  ],
  imports: [
    IonicPageModule.forChild(DeposePageTraca),
  ],
})
export class DeposePageModule {}
