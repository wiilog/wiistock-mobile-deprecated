import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {MainLoaderComponent} from '@helpers/components/main-loader/main-loader.component';
import {HeaderComponent} from '@helpers/components/header/header.component';
import {IconComponent} from '@helpers/components/icon/icon.component';
import {ListPanelComponent} from "@helpers/components/panel/list-panel/list-panel.component";
import {ListPanelItemComponent} from "@helpers/components/panel/list-panel/list-panel-item/list-panel-item.component";
import {PanelHeaderComponent} from "@helpers/components/panel/panel-header/panel-header.component";
import {FormPanelComponent} from "@helpers/components/panel/form-panel/form-panel.component";
import {FormPanelInputComponent} from "@helpers/components/panel/form-panel/form-panel-input/form-panel-input.component";


@NgModule({
    declarations: [
        SearchLocationComponent,
        MainLoaderComponent,
        PanelHeaderComponent,
        ListPanelComponent,
        ListPanelItemComponent,
        FormPanelInputComponent,
        FormPanelComponent,
        IconComponent,
        HeaderComponent
    ],
    exports: [
        SearchLocationComponent,
        MainLoaderComponent,
        PanelHeaderComponent,
        ListPanelComponent,
        ListPanelItemComponent,
        FormPanelInputComponent,
        FormPanelComponent,
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
