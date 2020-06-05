import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {MainMenuPage} from './main-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {MainMenuPageRoutingModule} from './main-menu-routing.module';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        MainMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [MainMenuPage]
})
export class MainMenuPageModule {
}
