import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

import {PreparationRefArticlesPage} from './preparation-ref-articles.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: PreparationRefArticlesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PreparationRefArticlesPageRoutingModule {
}
