import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {DispatchMenuPage} from './dispatch-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: DispatchMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DispatchMenuPageRoutingModule {
    public static readonly PATH: string = 'dispatch-menu';
}
