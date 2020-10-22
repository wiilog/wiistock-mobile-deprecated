import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {PriseDeposeMenuPageRoutingModule} from './prise-depose-menu-routing.module';
import {PriseDeposeMenuPage} from './prise-depose-menu.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        PriseDeposeMenuPageRoutingModule,
        CommonModule
    ],
    declarations: [PriseDeposeMenuPage]
})
export class PriseDeposeMenuPageModule {
}
