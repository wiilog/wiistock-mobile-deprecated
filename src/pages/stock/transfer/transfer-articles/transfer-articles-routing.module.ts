import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {TransferArticlesPage} from './transfer-articles.page';
import {CanLeaveGuard} from '@app/guards/can-leave/can-leave.guard';

const routes: Routes = [
    {
        path: '',
        component: TransferArticlesPage,
        canDeactivate: [CanLeaveGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class TransferArticlesPageRoutingModule {
    public static readonly PATH: string = 'transfer-articles';
}