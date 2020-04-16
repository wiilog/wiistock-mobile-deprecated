import {NgModule} from '@angular/core';
import {IonicSelectableModule} from 'ionic-selectable';
import {SearchLocationComponent} from '@helpers/components/search-location/search-location.component';
import {IonicModule} from 'ionic-angular';
import {MainLoaderComponent} from '@helpers/components/main-loader/main-loader.component';
import {MainHeaderComponent} from '@helpers/components/main-header/main-header.component';
import {IconComponent} from '@helpers/components/icon/icon.component';
import {BarcodeScannerComponent} from "@helpers/components/barcode-scanner/barcode-scanner.component";
import {ListPanelComponent} from "@helpers/components/panel/list-panel/list-panel.component";
import {ListPanelItemComponent} from "@helpers/components/panel/list-panel/list-panel-item/list-panel-item.component";
import {PanelHeaderComponent} from "@helpers/components/panel/panel-header/panel-header.component";
import {FormPanelComponent} from "@helpers/components/panel/form-panel/form-panel.component";
import {FormPanelInputComponent} from "@helpers/components/panel/form-panel/form-panel-input/form-panel-input.component";
import {SignaturePadModule } from "angular2-signaturepad";
import {FormPanelSigningComponent} from "@helpers/components/panel/form-panel/form-panel-signing/form-panel-signing.component";
import {SignaturePadComponent} from "@helpers/components/signature-pad/signature-pad.component";
import {MenuComponent} from "@helpers/components/menu/menu.component";
import {LongPressModule} from "ionic-long-press";
import {CardListComponent} from "@helpers/components/card-list/card-list.component";
import {SimpleFormComponent} from "@helpers/components/simple-form/simple-form.component";


@NgModule({
    declarations: [
        SearchLocationComponent,
        MainLoaderComponent,
        CardListComponent,
        PanelHeaderComponent,
        ListPanelComponent,
        ListPanelItemComponent,
        FormPanelSigningComponent,
        FormPanelInputComponent,
        FormPanelComponent,
        IconComponent,
        BarcodeScannerComponent,
        MainHeaderComponent,
        SignaturePadComponent,
        MenuComponent,
        SimpleFormComponent
    ],
    exports: [
        SearchLocationComponent,
        MainLoaderComponent,
        PanelHeaderComponent,
        ListPanelComponent,
        FormPanelComponent,
        IconComponent,
        BarcodeScannerComponent,
        MainHeaderComponent,
        MenuComponent,
        CardListComponent,
        SimpleFormComponent
    ],
    entryComponents: [
        SignaturePadComponent
    ],
    imports: [
        LongPressModule,
        IonicSelectableModule,
        IonicModule,
        SignaturePadModule,
    ],
})
export class HelpersModule {
}
