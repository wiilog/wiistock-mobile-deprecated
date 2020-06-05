import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {DeposeConfirmPage} from './depose-confirm.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DeposeConfirmPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DeposeConfirmPageRoutingModule {
    public static readonly PATH: string = 'depose-confirm';
}
