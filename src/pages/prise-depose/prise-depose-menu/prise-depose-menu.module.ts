import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {PriseDeposeMenuPage} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu';


@NgModule({
    declarations: [
        PriseDeposeMenuPage,
    ],
    imports: [
        IonicPageModule.forChild(PriseDeposeMenuPage)
    ],
})
export class PriseDeposeMenuPageModule {
}
