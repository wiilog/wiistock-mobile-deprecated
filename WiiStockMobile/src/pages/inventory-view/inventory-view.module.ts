import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InventoryViewPage } from './inventory-view';

@NgModule({
  declarations: [
    InventoryViewPage,
  ],
  imports: [
    IonicPageModule.forChild(InventoryViewPage),
  ],
})
export class InventoryViewPageModule {}
