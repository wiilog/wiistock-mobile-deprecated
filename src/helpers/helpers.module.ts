import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';


@NgModule({
    declarations: [
        SearchLocationComponent
    ],
    exports: [
        SearchLocationComponent
    ],
    imports: [
        IonicSelectableModule,
        IonicModule
    ],
})
export class HelpersModule {
}
