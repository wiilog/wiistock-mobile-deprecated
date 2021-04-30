import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';
import {TransferMenuPage} from "@pages/stock/transfer/transfer-menu/transfer-menu.page";

const routes: Routes = [
    {
        path: '',
        component: TransferMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransferMenuPageRoutingModule {
}
