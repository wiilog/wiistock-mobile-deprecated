import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {InventoryMissionZonesPage} from './inventory-mission-zones.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryMissionZonesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryMissionZonesPageRoutingModule {
}
