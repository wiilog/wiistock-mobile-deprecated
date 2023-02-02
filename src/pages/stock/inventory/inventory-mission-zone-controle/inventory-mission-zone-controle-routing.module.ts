import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {InventoryMissionZoneControlePage} from './inventory-mission-zone-controle.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: InventoryMissionZoneControlePage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryMissionZoneControlePageRoutingModule {
}
