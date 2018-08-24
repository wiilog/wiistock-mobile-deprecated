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
  },
  { path: 'ordre_detail', loadChildren: './ordre-detail/ordre-detail.module#OrdreDetailPageModule' },
  { path: 'preparation_add', loadChildren: './preparation-add/preparation-add.module#PreparationAddPageModule' },
  { path: 'preparation_recapitulatif', loadChildren: './preparation-recapitulatif/preparation-recapitulatif.module#PreparationRecapitulatifPageModule' },
  { path: 'workflow', loadChildren: './workflow/workflow.module#WorkflowPageModule' },
  { path: 'inventory_list', loadChildren: './inventory-list/inventory-list.module#InventoryListPageModule' },
  { path: 'inventory_view', loadChildren: './inventory-view/inventory-view.module#InventoryViewPageModule' },  { path: 'preparation_flash', loadChildren: './preparation-flash/preparation-flash.module#PreparationFlashPageModule' },
  { path: 'entree_flash', loadChildren: './entree-flash/entree-flash.module#EntreeFlashPageModule' },
  { path: 'entree_add', loadChildren: './entree-add/entree-add.module#EntreeAddPageModule' },
  { path: 'entree_recapitulatif', loadChildren: './entree-recapitulatif/entree-recapitulatif.module#EntreeRecapitulatifPageModule' },
  { path: 'transfert_flash', loadChildren: './transfert-flash/transfert-flash.module#TransfertFlashPageModule' },
  { path: 'transfert_add', loadChildren: './transfert-add/transfert-add.module#TransfertAddPageModule' },
  { path: 'transfert_recapitulatif', loadChildren: './transfert-recapitulatif/transfert-recapitulatif.module#TransfertRecapitulatifPageModule' },
  { path: 'reception_flash', loadChildren: './reception-flash/reception-flash.module#ReceptionFlashPageModule' },
  { path: 'reception_add', loadChildren: './reception-add/reception-add.module#ReceptionAddPageModule' },
  { path: 'reception_recapitulatif', loadChildren: './reception-recapitulatif/reception-recapitulatif.module#ReceptionRecapitulatifPageModule' },
  { path: 'sortie_recapitulatif', loadChildren: './sortie-recapitulatif/sortie-recapitulatif.module#SortieRecapitulatifPageModule' },
  { path: 'sortie_flash', loadChildren: './sortie-flash/sortie-flash.module#SortieFlashPageModule' },
  { path: 'sortie_add', loadChildren: './sortie-add/sortie-add.module#SortieAddPageModule' },
  { path: 'expedition_flash', loadChildren: './expedition-flash/expedition-flash.module#ExpeditionFlashPageModule' },
  { path: 'expedition_recapitulatif', loadChildren: './expedition-recapitulatif/expedition-recapitulatif.module#ExpeditionRecapitulatifPageModule' }



];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
