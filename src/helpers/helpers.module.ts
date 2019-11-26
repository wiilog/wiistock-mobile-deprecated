import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {MainLoaderComponent} from '@helpers/components/main-loader/main-loader.component';
import {HeaderComponent} from '@helpers/components/header/header.component';
import {IconComponent} from '@helpers/components/icon/icon.component';
import {ListHeaderComponent} from "@helpers/components/list/list-header/list-header.component";
import {ListElementComponent} from "@helpers/components/list/list-element/list-element.component";
import {ListComponent} from "@helpers/components/list/list/list.component";


@NgModule({
    declarations: [
        SearchLocationComponent,
        MainLoaderComponent,
        ListHeaderComponent,
        ListComponent,
        ListElementComponent,
        IconComponent,
        HeaderComponent
    ],
    exports: [
        SearchLocationComponent,
        MainLoaderComponent,
        ListHeaderComponent,
        ListComponent,
        ListElementComponent,
        IconComponent,
        HeaderComponent
    ],
    imports: [
        IonicSelectableModule,
        IonicModule
    ],
})
export class HelpersModule {
}
