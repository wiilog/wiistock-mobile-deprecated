import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {MainLoaderComponent} from '@helpers/components/main-loader/main-loader.component';
import {HeaderComponent} from '@helpers/components/header/header.component';


@NgModule({
    declarations: [
        SearchLocationComponent,
        MainLoaderComponent,
        HeaderComponent,
    ],
    exports: [
        SearchLocationComponent,
        MainLoaderComponent,
        HeaderComponent,
    ],
    imports: [
        IonicSelectableModule,
        IonicModule
    ],
})
export class HelpersModule {
}
