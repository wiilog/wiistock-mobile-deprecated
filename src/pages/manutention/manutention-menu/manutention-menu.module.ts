import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManutentionMenuPageRoutingModule} from './manutention-menu-routing.module';
import {ManutentionMenuPage} from './manutention-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManutentionMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [ManutentionMenuPage]
})
export class ManutentionMenuPageModule {
}
