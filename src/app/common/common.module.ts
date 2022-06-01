import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {IonicSelectableModule} from 'ionic-selectable';
import {FormsModule} from '@angular/forms';
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
import {IonicModule} from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http';
import {Network} from '@ionic-native/network/ngx';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {Camera} from '@ionic-native/camera/ngx';
import {SQLite} from '@ionic-native/sqlite/ngx';
import {AppVersion} from '@ionic-native/app-version/ngx';
import {StatsSlidersComponent} from '@app/common/components/stats-sliders/stats-sliders.component';
import {FormPanelSelectComponent} from '@app/common/components/panel/form-panel/form-panel-select/form-panel-select.component';
import {FormPanelCameraComponent} from '@app/common/components/panel/form-panel/form-panel-camera/form-panel-camera.component';
import {FormPanelToggleComponent} from '@app/common/components/panel/form-panel/form-panel-toggle/form-panel-toggle.component';
import {FormPanelDirective} from './directives/form-panel/form-panel.directive';
import {FormPanelCalendarComponent} from '@app/common/components/panel/form-panel/form-panel-calendar/form-panel-calendar.component';
import {DatePicker} from '@ionic-native/date-picker/ngx';
import {FormViewerAttachmentsComponent} from '@app/common/components/panel/form-panel/form-viewer-attachments/form-viewer-attachments.component';
import {FormViewerDirective} from '@app/common/directives/form-viewer/form-viewer.directive';
import {FormPanelFieldComponent} from '@app/common/components/panel/form-panel/form-panel-field/form-panel-field.component';
import {ServerImageComponent} from '@app/common/components/server-image/server-image.component';
import {FormViewerTextComponent} from '@app/common/components/panel/form-panel/form-viewer-text/form-viewer-text.component';
import {FormPanelButtonsComponent} from '@app/common/components/panel/form-panel/form-panel-buttons/form-panel-buttons.component';
import {BadgeComponent} from '@app/common/components/badge/badge.component';
import {FormViewerTableComponent} from '@app/common/components/panel/form-panel/form-viewer-table/form-viewer-table.component';
import {LeafletMapComponent} from '@app/common/components/leaflet-map/leaflet-map.component';
import {SimpleCardComponent} from '@app/common/components/simple-card/simple-card.component';
import {TransportCardComponent} from '@app/common/components/transport-card/transport-card.component';
import {PackCountComponent} from '@app/common/components/pack-count/pack-count.component';
import {NumberInputComponent} from '@app/common/components/number-input/number-input.component';

@NgModule({
    declarations: [
        BarcodeScannerComponent,
        BadgeComponent,
        CardListComponent,
        IconComponent,
        MainHeaderComponent,
        MainLoaderComponent,
        MenuComponent,
        FormPanelInputComponent,
        FormPanelSigningComponent,
        FormPanelFieldComponent,
        FormPanelCameraComponent,
        FormPanelToggleComponent,
        FormPanelCalendarComponent,
        FormPanelSelectComponent,
        FormPanelButtonsComponent,
        FormPanelComponent,
        FormViewerAttachmentsComponent,
        FormViewerTextComponent,
        FormViewerTableComponent,
        ListPanelItemComponent,
        ListPanelComponent,
        PanelHeaderComponent,
        SearchItemComponent,
        SelectItemComponent,
        SignaturePadComponent,
        SimpleFormComponent,
        StatsSlidersComponent,
        FormPanelDirective,
        FormViewerDirective,
        ServerImageComponent,
        LeafletMapComponent,
        SimpleCardComponent,
        TransportCardComponent,
        PackCountComponent,
        NumberInputComponent,
    ],
    imports: [
        AngularCommonModule,
        HttpClientModule,
        IonicModule,
        IonicSelectableModule,
        FormsModule
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
        BadgeComponent,
        FormPanelComponent,
        SimpleFormComponent,
        CardListComponent,
        PanelHeaderComponent,
        ListPanelItemComponent,
        ServerImageComponent,
        LeafletMapComponent,
        SimpleCardComponent,
        TransportCardComponent,
        PackCountComponent,
        NumberInputComponent,
    ],
    providers: [
        // ionic
        Network,
        BarcodeScanner,
        SQLite,
        AppVersion,
        Camera,
        DatePicker,
    ],
    entryComponents: [
        SignaturePadComponent,
        FormPanelInputComponent,
        FormPanelSigningComponent,
        FormPanelCameraComponent,
        FormPanelToggleComponent,
        FormPanelCalendarComponent,
        FormPanelSelectComponent,
        FormViewerAttachmentsComponent,
        FormViewerTextComponent,
        FormViewerTableComponent,
    ]
})
export class CommonModule {
}
