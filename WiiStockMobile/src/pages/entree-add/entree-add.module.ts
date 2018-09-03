import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EntreeAddPage } from './entree-add';

@NgModule({
  declarations: [
    EntreeAddPage,
  ],
  imports: [
    IonicPageModule.forChild(EntreeAddPage),
  ],
})
export class EntreeAddPageModule {}
