import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ManutentionValidatePage } from './manutention-validate';
import {HelpersModule} from "@helpers/helpers.module";

@NgModule({
  declarations: [
    ManutentionValidatePage,
  ],
    imports: [
        IonicPageModule.forChild(ManutentionValidatePage),
        HelpersModule,
    ],
})
export class ManutentionValidatePageModule {}
