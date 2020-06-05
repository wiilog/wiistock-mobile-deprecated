import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PreparationMenuPageRoutingModule} from './preparation-menu-routing.module';
import {PreparationMenuPage} from './preparation-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PreparationMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [PreparationMenuPage]
})
export class PreparationMenuPageModule {
}
