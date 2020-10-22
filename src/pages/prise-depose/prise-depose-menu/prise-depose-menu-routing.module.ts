import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PriseDeposeMenuPage} from './prise-depose-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PriseDeposeMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PriseDeposeMenuPageRoutingModule {
    public static readonly PATH: string = 'prise-depose-menu';
}
