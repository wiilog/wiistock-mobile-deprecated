import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { InventoryListPage } from './inventory-list';

@NgModule({
  declarations: [
    InventoryListPage,
  ],
  imports: [
    IonicPageModule.forChild(InventoryListPage),
  ],
})
export class InventoryListPageModule {}
