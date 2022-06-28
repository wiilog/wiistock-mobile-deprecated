import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransportRoundListPage} from './transport-round-list.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransportRoundListPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransportRoundListPageRoutingModule {
}
