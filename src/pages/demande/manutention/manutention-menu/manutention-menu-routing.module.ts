import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {ManutentionMenuPage} from './manutention-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: ManutentionMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ManutentionMenuPageRoutingModule {
    public static readonly PATH: string = 'manutention-menu';
}
