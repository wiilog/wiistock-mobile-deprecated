import {NgModule} from '@angular/core';
import {IonicPageModule} from 'ionic-angular';
import {TracaMenuPage} from '@pages/traca/traca-menu/traca-menu';


@NgModule({
    declarations: [
        TracaMenuPage,
    ],
    imports: [
        IonicPageModule.forChild(TracaMenuPage)
    ],
})
export class TracaMenuModule {
}
