import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {HeaderComponent} from "@helpers/components/header/header.component";


@NgModule({
    declarations: [
        SearchLocationComponent,
        HeaderComponent
    ],
    exports: [
        SearchLocationComponent,
        HeaderComponent
    ],
    imports: [
        IonicSelectableModule,
        IonicModule
    ],
})
export class HelpersModule {
}
