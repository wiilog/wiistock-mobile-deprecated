import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {ManutentionMenuPage} from './manutention-menu';
import {HelpersModule} from '@helpers/helpers.module';

@NgModule({
    declarations: [
        ManutentionMenuPage,
    ],
    imports: [
        IonicPageModule.forChild(ManutentionMenuPage),
        HelpersModule,
    ],
})
export class ManutentionMenuPageModule {
}
