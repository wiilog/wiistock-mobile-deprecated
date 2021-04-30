import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {UserDisconnectedGuard} from '@app/guards/user-disconnected.guard';
import {UserConnectedGuard} from '@app/guards/user-connected.guard';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';

const routes: Routes = [
    {
        path: NavPathEnum.PARAMS,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('../pages/params/params.module').then(m => m.ParamsPageModule)
    },
    {
        path: NavPathEnum.LOGIN,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('../pages/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: NavPathEnum.MAIN_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/main-menu/main-menu.module').then(m => m.MainMenuPageModule)
    },
    {
        path: NavPathEnum.TRACKING_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/tracking-menu/tracking-menu.module').then(m => m.TrackingMenuPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-menu/dispatch-menu.module').then(m => m.DispatchMenuPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_PACKS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-packs/dispatch-packs.module').then(m => m.DispatchPacksPageModule)
    },
    {
        path: NavPathEnum.DISPATCH_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-validate/dispatch-validate.module').then(m => m.DispatchValidatePageModule)
    },
    {
        path: NavPathEnum.DISPATCH_PACK_CONFIRM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-pack-confirm/dispatch-pack-confirm.module').then(m => m.DispatchPackConfirmPageModule)
    },
    {
        path: NavPathEnum.EMPLACEMENT_SCAN,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/emplacement-scan/emplacement-scan.module').then(m => m.EmplacementScanPageModule)
    },
    {
        path: NavPathEnum.PRISE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/prise/prise.module').then(m => m.PrisePageModule)
    },
    {
        path: NavPathEnum.DEPOSE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/depose/depose.module').then(m => m.DeposePageModule)
    },
    {
        path: NavPathEnum.MOVEMENT_CONFIRM,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/movement-confirm/movement-confirm.module').then(m => m.MovementConfirmPageModule)
    },
    {
        path: NavPathEnum.MOVEMENT_CONFIRM_SUB_PACK,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/movement-confirm/movement-confirm.module').then(m => m.MovementConfirmPageModule)
    },
    {
        path: NavPathEnum.NEW_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/new-emplacement/new-emplacement.module').then(m => m.NewEmplacementPageModule)
    },
    {
        path: NavPathEnum.HANDLING_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/handling/handling-menu/handling-menu.module').then(m => m.HandlingMenuPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-menu/demande-menu.module').then(m => m.DemandeMenuPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu.module').then(m => m.DemandeLivraisonMenuPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles.module').then(m => m.DemandeLivraisonArticlesPageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-article-take/demande-livraison-article-take.module').then(m => m.DemandeLivraisonArticleTakePageModule)
    },
    {
        path: NavPathEnum.DEMANDE_LIVRAISON_HEADER,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header.module').then(m => m.DemandeLivraisonHeaderPageModule)
    },
    {
        path: NavPathEnum.HANDLING_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/handling/handling-validate/handling-validate.module').then(m => m.HandlingValidatePageModule)
    },
    {
        path: NavPathEnum.STOCK_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/stock-menu/stock-menu.module').then(m => m.StockMenuPageModule)
    },

    // collecte
    {
        path: NavPathEnum.COLLECTE_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-menu/collecte-menu.module').then(m => m.CollecteMenuPageModule)
    },
    {
        path: NavPathEnum.COLLECTE_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-articles/collecte-articles.module').then(m => m.CollecteArticlesPageModule)
    },
    {
        path: NavPathEnum.COLLECTE_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-article-take/collecte-article-take.module').then(m => m.CollecteArticleTakePageModule)
    },

    // livraison
    {
        path: NavPathEnum.LIVRAISON_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-menu/livraison-menu.module').then(m => m.LivraisonMenuPageModule)
    },
    {
        path: NavPathEnum.LIVRAISON_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-articles/livraison-articles.module').then(m => m.LivraisonArticlesPageModule)
    },
    {
        path: NavPathEnum.LIVRAISON_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-emplacement/livraison-emplacement.module').then(m => m.LivraisonEmplacementPageModule)
    },
    {
        path: NavPathEnum.LIVRAISON_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-article-take/livraison-article-take.module').then(m => m.LivraisonArticleTakePageModule)
    },

    // preparation
    {
        path: NavPathEnum.PREPARATION_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-menu/preparation-menu.module').then(m => m.PreparationMenuPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-articles/preparation-articles.module').then(m => m.PreparationArticlesPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_EMPLACEMENT,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-emplacement/preparation-emplacement.module').then(m => m.PreparationEmplacementPageModule)
    },
    {
        path: NavPathEnum.PREPARATION_ARTICLE_TAKE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-article-take/preparation-article-take.module').then(m => m.PreparationArticleTakePageModule)
    },
    {
        path: NavPathEnum.PREPARATION_REF_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-ref-articles/preparation-ref-articles.module').then(m => m.PreparationRefArticlesPageModule)
    },

    // inventories
    {
        path: NavPathEnum.INVENTORY_LOCATIONS,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-locations/inventory-locations.module').then(m => m.InventoryLocationsPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_LOCATIONS_ANOMALIES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-locations-anomalies/inventory-locations-anomalies.module').then(m => m.InventoryLocationsAnomaliesPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-articles/inventory-articles.module').then(m => m.InventoryArticlesPageModule)
    },
    {
        path: NavPathEnum.INVENTORY_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-validate/inventory-validate.module').then(m => m.InventoryValidatePageModule)
    },
    {
        path: NavPathEnum.TRANSFER_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-menu/transfer-menu.module').then(m => m.TransferMenuPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_LIST,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-list/transfer-list.module').then(m => m.TransferListPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_ARTICLES,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-articles/transfer-articles.module').then(m => m.TransferArticlesPageModule)
    },
    {
        path: NavPathEnum.TRANSFER_VALIDATE,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/stock/transfer/transfer-validate/transfer-validate.module').then(m => m.TransferValidatePageModule)
    },
    {
        path: NavPathEnum.PRISE_DEPOSE_MENU,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('@pages/prise-depose/prise-depose-menu/prise-depose-menu.module').then(m => m.PriseDeposeMenuPageModule)
    },
    {
        path: UngroupScanLocationPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/ungroup/ungroup-scan-location/ungroup-scan-location.module').then(m => m.UngroupScanLocationPageModule)
    },
    {
        path: UngroupScanGroupPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/ungroup/ungroup-scan-group/ungroup-scan-group.module').then(m => m.UngroupScanGroupPageModule)
    },
    {
        path: UngroupConfirmPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/ungroup/ungroup-confirm/ungroup-confirm.module').then(m => m.UngroupConfirmPageModule)
    },
    {
        path: GroupScanGroupPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/group/group-scan-group/group-scan-group.module').then(m => m.GroupScanGroupPageModule)
    },
    {
        path: GroupContentPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/group/group-content/group-content.module').then(m => m.GroupContentPageModule)
    },

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
