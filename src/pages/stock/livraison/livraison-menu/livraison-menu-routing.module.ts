import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {LivraisonMenuPage} from './livraison-menu.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: LivraisonMenuPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LivraisonMenuPageRoutingModule {
    public static readonly PATH: string = 'livraison-menu';
}
