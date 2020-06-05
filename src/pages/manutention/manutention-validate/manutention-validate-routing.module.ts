import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManutentionValidatePage} from './manutention-validate.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManutentionValidatePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManutentionValidatePageRoutingModule {
    public static readonly PATH: string = 'manutention-validate';
}
