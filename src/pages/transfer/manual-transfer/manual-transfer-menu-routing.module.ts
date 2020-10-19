import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManualTransferMenuPage} from './manual-transfer-menu-page.component';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManualTransferMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManualTransferMenuPageRoutingModule {
    public static readonly PATH: string = 'manual-transfer';
}
