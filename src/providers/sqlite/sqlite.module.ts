import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SqliteProvider } from './sqlite';

@NgModule({
  // declarations: [
  //   SqliteProvider,
  // ],
  imports: [
    IonicPageModule.forChild(SqliteProvider),
  ],
})
export class SqlitePageModule {}
