import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {ManutentionValidatePageRoutingModule} from './manutention-validate-routing.module';
import {ManutentionValidatePage} from './manutention-validate.page';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonModule} from '@app/common/common.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        ManutentionValidatePageRoutingModule,
        CommonModule
    ],
    declarations: [ManutentionValidatePage]
})
export class ManutentionValidatePageModule {
}
