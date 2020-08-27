import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {UserDisconnectedGuard} from '@app/guards/user-disconnected.guard';
import {UserConnectedGuard} from '@app/guards/user-connected.guard';
import {LoginPageRoutingModule} from '@pages/login/login-routing.module';
import {ParamsPageRoutingModule} from '@pages/params/params-routing.module';
import {MainMenuPageRoutingModule} from '@pages/main-menu/main-menu-routing.module';
import {PriseDeposeMenuPageRoutingModule} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu-routing.module';
import {EmplacementScanPageRoutingModule} from '@pages/prise-depose/emplacement-scan/emplacement-scan-routing.module';
import {PrisePageRoutingModule} from '@pages/prise-depose/prise/prise-routing.module';
import {DeposePageRoutingModule} from '@pages/prise-depose/depose/depose-routing.module';
import {ConfirmPageRoutingModule} from '@pages/prise-depose/movement-confirm/movement-confirm-routing.module';
import {NewEmplacementPageRoutingModule} from '@pages/new-emplacement/new-emplacement-routing.module';
import {ManutentionMenuPageRoutingModule} from '@pages/demande/manutention/manutention-menu/manutention-menu-routing.module';
import {ManutentionValidatePageRoutingModule} from '@pages/demande/manutention/manutention-validate/manutention-validate-routing.module';
import {StockMenuPageRoutingModule} from '@pages/stock/stock-menu/stock-menu-routing.module';
import {CollecteMenuPageRoutingModule} from '@pages/stock/collecte/collecte-menu/collecte-menu-routing.module';
import {CollecteArticlesPageRoutingModule} from '@pages/stock/collecte/collecte-articles/collecte-articles-routing.module';
import {CollecteArticleTakePageRoutingModule} from '@pages/stock/collecte/collecte-article-take/collecte-article-take-routing.module';
import {LivraisonMenuPageRoutingModule} from '@pages/stock/livraison/livraison-menu/livraison-menu-routing.module';
import {LivraisonEmplacementPageRoutingModule} from '@pages/stock/livraison/livraison-emplacement/livraison-emplacement-routing.module';
import {LivraisonArticleTakePageRoutingModule} from '@pages/stock/livraison/livraison-article-take/livraison-article-take-routing.module';
import {LivraisonArticlesPageRoutingModule} from '@pages/stock/livraison/livraison-articles/livraison-articles-routing.module';
import {PreparationMenuPageRoutingModule} from '@pages/stock/preparation/preparation-menu/preparation-menu-routing.module';
import {PreparationArticlesPageRoutingModule} from '@pages/stock/preparation/preparation-articles/preparation-articles-routing.module';
import {PreparationEmplacementPageRoutingModule} from '@pages/stock/preparation/preparation-emplacement/preparation-emplacement-routing.module';
import {PreparationArticleTakePageRoutingModule} from '@pages/stock/preparation/preparation-article-take/preparation-article-take-routing.module';
import {PreparationRefArticlesPageRoutingModule} from '@pages/stock/preparation/preparation-ref-articles/preparation-ref-articles-routing.module';
import {InventoryLocationsPageRoutingModule} from '@pages/stock/inventory/inventory-locations/inventory-locations-routing.module';
import {InventoryArticlesPageRoutingModule} from '@pages/stock/inventory/inventory-articles/inventory-articles-routing.module';
import {InventoryValidatePageRoutingModule} from '@pages/stock/inventory/inventory-validate/inventory-validate-routing.module';
import {DemandeMenuPageRoutingModule} from '@pages/demande/demande-menu/demande-menu-routing.module';
import {DemandeLivraisonMenuPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu-routing.module';
import {DemandeLivraisonHeaderPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header-routing.module';
import {DemandeLivraisonArticlesPageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles-routing.module';
import {DemandeLivraisonArticleTakePageRoutingModule} from '@pages/demande/demande-livraison/demande-livraison-article-take/demande-livraison-article-take-routing.module';
import {InventoryLocationsAnomaliesPageRoutingModule} from '@pages/stock/inventory/inventory-locations-anomalies/inventory-locations-anomalies-routing.module';
import {TrackingMenuPageRoutingModule} from '@pages/tracking/tracking-menu/tracking-menu-routing.module';
import {DispatchMenuPageRoutingModule} from '@pages/tracking/dispatch/dispatch-menu/dispatch-menu-routing.module';
import {DispatchPacksPageRoutingModule} from '@pages/tracking/dispatch/dispatch-packs/dispatch-packs-routing.module';
import {DispatchValidatePageRoutingModule} from '@pages/tracking/dispatch/dispatch-validate/dispatch-validate-routing.module';


const routes: Routes = [
    {
        path: ParamsPageRoutingModule.PATH,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('../pages/params/params.module').then(m => m.ParamsPageModule)
    },
    {
        path: LoginPageRoutingModule.PATH,
        canActivate: [UserDisconnectedGuard],
        loadChildren: () => import('../pages/login/login.module').then(m => m.LoginPageModule)
    },
    {
        path: MainMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/main-menu/main-menu.module').then(m => m.MainMenuPageModule)
    },
    {
        path: TrackingMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/tracking-menu/tracking-menu.module').then(m => m.TrackingMenuPageModule)
    },
    {
        path: DispatchMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-menu/dispatch-menu.module').then(m => m.DispatchMenuPageModule)
    },
    {
        path: DispatchPacksPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-packs/dispatch-packs.module').then(m => m.DispatchPacksPageModule)
    },
    {
        path: DispatchValidatePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/tracking/dispatch/dispatch-validate/dispatch-validate.module').then(m => m.DispatchValidatePageModule)
    },
    {
        path: PriseDeposeMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/prise-depose-menu/prise-depose-menu.module').then(m => m.PriseDeposeMenuPageModule)
    },
    {
        path: EmplacementScanPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/emplacement-scan/emplacement-scan.module').then(m => m.EmplacementScanPageModule)
    },
    {
        path: PrisePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/prise/prise.module').then(m => m.PrisePageModule)
    },
    {
        path: DeposePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/depose/depose.module').then(m => m.DeposePageModule)
    },
    {
        path: ConfirmPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/prise-depose/movement-confirm/movement-confirm.module').then(m => m.MovementConfirmPageModule)
    },
    {
        path: NewEmplacementPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/new-emplacement/new-emplacement.module').then(m => m.NewEmplacementPageModule)
    },
    {
        path: ManutentionMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/manutention/manutention-menu/manutention-menu.module').then(m => m.ManutentionMenuPageModule)
    },
    {
        path: DemandeMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-menu/demande-menu.module').then(m => m.DemandeMenuPageModule)
    },
    {
        path: DemandeLivraisonMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-menu/demande-livraison-menu.module').then(m => m.DemandeLivraisonMenuPageModule)
    },
    {
        path: DemandeLivraisonArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-articles/demande-livraison-articles.module').then(m => m.DemandeLivraisonArticlesPageModule)
    },
    {
        path: DemandeLivraisonArticleTakePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-article-take/demande-livraison-article-take.module').then(m => m.DemandeLivraisonArticleTakePageModule)
    },
    {
        path: DemandeLivraisonHeaderPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/demande-livraison/demande-livraison-header/demande-livraison-header.module').then(m => m.DemandeLivraisonHeaderPageModule)
    },
    {
        path: ManutentionValidatePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/demande/manutention/manutention-validate/manutention-validate.module').then(m => m.ManutentionValidatePageModule)
    },
    {
        path: StockMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/stock-menu/stock-menu.module').then(m => m.StockMenuPageModule)
    },

    // collecte
    {
        path: CollecteMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-menu/collecte-menu.module').then(m => m.CollecteMenuPageModule)
    },
    {
        path: CollecteArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-articles/collecte-articles.module').then(m => m.CollecteArticlesPageModule)
    },
    {
        path: CollecteArticleTakePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/collecte/collecte-article-take/collecte-article-take.module').then(m => m.CollecteArticleTakePageModule)
    },

    // livraison
    {
        path: LivraisonMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-menu/livraison-menu.module').then(m => m.LivraisonMenuPageModule)
    },
    {
        path: LivraisonArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-articles/livraison-articles.module').then(m => m.LivraisonArticlesPageModule)
    },
    {
        path: LivraisonEmplacementPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-emplacement/livraison-emplacement.module').then(m => m.LivraisonEmplacementPageModule)
    },
    {
        path: LivraisonArticleTakePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/livraison/livraison-article-take/livraison-article-take.module').then(m => m.LivraisonArticleTakePageModule)
    },

    // preparation
    {
        path: PreparationMenuPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-menu/preparation-menu.module').then(m => m.PreparationMenuPageModule)
    },
    {
        path: PreparationArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-articles/preparation-articles.module').then(m => m.PreparationArticlesPageModule)
    },
    {
        path: PreparationEmplacementPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-emplacement/preparation-emplacement.module').then(m => m.PreparationEmplacementPageModule)
    },
    {
        path: PreparationArticleTakePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-article-take/preparation-article-take.module').then(m => m.PreparationArticleTakePageModule)
    },
    {
        path: PreparationRefArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/preparation/preparation-ref-articles/preparation-ref-articles.module').then(m => m.PreparationRefArticlesPageModule)
    },

    // inventories
    {
        path: InventoryLocationsPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-locations/inventory-locations.module').then(m => m.InventoryLocationsPageModule)
    },
    {
        path: InventoryLocationsAnomaliesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-locations-anomalies/inventory-locations-anomalies.module').then(m => m.InventoryLocationsAnomaliesPageModule)
    },
    {
        path: InventoryArticlesPageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-articles/inventory-articles.module').then(m => m.InventoryArticlesPageModule)
    },
    {
        path: InventoryValidatePageRoutingModule.PATH,
        canActivate: [UserConnectedGuard],
        loadChildren: () => import('../pages/stock/inventory/inventory-validate/inventory-validate.module').then(m => m.InventoryValidatePageModule)
    },

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
