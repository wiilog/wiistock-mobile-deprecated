import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IonicModule} from '@ionic/angular';
import {LoginPage} from './login.page';
import {CommonModule} from '@app/common/common.module';
import {LoginPageRoutingModule} from './login-routing.module';

@NgModule({
    imports: [
        AngularCommonModule,
        FormsModule,
        IonicModule,
        LoginPageRoutingModule,
        CommonModule
    ],
    declarations: [LoginPage]
})
export class LoginPageModule {
}
