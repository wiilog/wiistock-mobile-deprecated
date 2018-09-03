import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WorkflowPage } from './workflow';

@NgModule({
  declarations: [
    WorkflowPage,
  ],
  imports: [
    IonicPageModule.forChild(WorkflowPage),
  ],
})
export class WorkflowPageModule {}
