import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {IonicSelectableModule} from 'ionic-selectable';
import {SignaturePadModule} from 'angular2-signaturepad';
import {FormsModule} from '@angular/forms';
import {LongPressModule} from 'ionic-long-press';
import {BarcodeScannerComponent} from '@app/common/components/barcode-scanner/barcode-scanner.component';
import {CardListComponent} from '@app/common/components/card-list/card-list.component';
import {IconComponent} from '@app/common/components/icon/icon.component';
import {MainHeaderComponent} from '@app/common/components/main-header/main-header.component';
import {MainLoaderComponent} from '@app/common/components/main-loader/main-loader.component';
import {MenuComponent} from '@app/common/components/menu/menu.component';
import {FormPanelInputComponent} from '@app/common/components/panel/form-panel/form-panel-input/form-panel-input.component';
import {FormPanelSigningComponent} from '@app/common/components/panel/form-panel/form-panel-signing/form-panel-signing.component';
import {FormPanelComponent} from '@app/common/components/panel/form-panel/form-panel.component';
import {ListPanelItemComponent} from '@app/common/components/panel/list-panel/list-panel-item/list-panel-item.component';
import {ListPanelComponent} from '@app/common/components/panel/list-panel/list-panel.component';
import {PanelHeaderComponent} from '@app/common/components/panel/panel-header/panel-header.component';
import {SearchItemComponent} from '@app/common/components/select-item/search-item/search-item.component';
import {SelectItemComponent} from '@app/common/components/select-item/select-item.component';
import {SignaturePadComponent} from '@app/common/components/signature-pad/signature-pad.component';
import {SimpleFormComponent} from '@app/common/components/simple-form/simple-form.component';
import {HAMMER_GESTURE_CONFIG} from '@angular/platform-browser';
import {IonicGestureConfig} from '@app/utils/ionic-gesture-config';
import {IonicModule} from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import {Network} from '@ionic-native/network/ngx';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {SQLite} from '@ionic-native/sqlite/ngx';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {StatsSlidersComponent} from '@app/common/components/stats-sliders/stats-sliders.component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';


@NgModule({
    declarations: [
        BarcodeScannerComponent,
        CardListComponent,
        IconComponent,
        MainHeaderComponent,
        MainLoaderComponent,
        MenuComponent,
        FormPanelInputComponent,
        FormPanelSigningComponent,
        FormPanelSelectComponent,
        FormPanelComponent,
        ListPanelItemComponent,
        ListPanelComponent,
        PanelHeaderComponent,
        SearchItemComponent,
        SelectItemComponent,
        SignaturePadComponent,
        SimpleFormComponent,
        StatsSlidersComponent
    ],
    imports: [
        AngularCommonModule,
        HttpClientModule,
        IonicModule,
        IonicSelectableModule,
        SignaturePadModule,
        FormsModule,
        LongPressModule
    ],
    exports: [
        MainLoaderComponent,
        IconComponent,
        MainHeaderComponent,
        MenuComponent,
        StatsSlidersComponent,
        SelectItemComponent,
        ListPanelComponent,
        BarcodeScannerComponent,
        FormPanelComponent,
        SimpleFormComponent,
        CardListComponent,
        PanelHeaderComponent
    ],
    providers: [
        // ionic
        Network,
        BarcodeScanner,
        SQLite,
        AppVersion,

        // ionic-long-press
        {provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig},
    ],
    entryComponents: [
        SignaturePadComponent
    ]
})
export class CommonModule {
}
