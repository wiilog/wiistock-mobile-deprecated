import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LoginPage} from './login.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

import LOGIN_PATH from './login-path';

const routes: Routes = [
    {
        path: '',
        component: LoginPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LoginPageRoutingModule {
    public static readonly PATH: string = LOGIN_PATH;
}
