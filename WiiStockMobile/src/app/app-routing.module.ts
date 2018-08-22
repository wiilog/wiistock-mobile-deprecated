import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule'
  },
  {
    path: 'list',
    loadChildren: './list/list.module#ListPageModule'
  },  { path: 'preparation_add', loadChildren: './preparation-add/preparation-add.module#PreparationAddPageModule' },
  { path: 'preparation_recapitulatif', loadChildren: './preparation-recapitulatif/preparation-recapitulatif.module#PreparationRecapitulatifPageModule' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
