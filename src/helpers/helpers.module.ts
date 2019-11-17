import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {MainLoaderComponent} from "@helpers/components/main-loader/main-loader.component";


@NgModule({
    declarations: [
        SearchLocationComponent,
        MainLoaderComponent
    ],
    exports: [
        SearchLocationComponent,
        MainLoaderComponent
    ],
    imports: [
        IonicSelectableModule,
        IonicModule
    ],
})
export class HelpersModule {
}
