import {Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Observable, Subscription, merge, of, zip} from 'rxjs';
import {filter, flatMap, map, take, tap} from 'rxjs/operators';
import {TitleConfig} from '@app/common/components/main-header/title-config';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {StorageService} from '@app/common/services/storage.service';
import {ActivatedRoute, NavigationEnd, NavigationStart, Router} from '@angular/router';
import {MainMenuPageRoutingModule} from '@pages/main-menu/main-menu-routing.module';
import {ParamsPageRoutingModule} from '@pages/params/params-routing.module';
import {LoginPageRoutingModule} from '@pages/login/login-routing.module';
import {SqliteService} from '@app/common/services/sqlite.service';
import {RouterDirection} from '@ionic/core';
import {NavService} from '@app/common/services/nav.service';
import {NavController} from '@ionic/angular';
import {PriseDeposeMenuPageRoutingModule} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu-routing.module';
import {EmplacementScanPageRoutingModule} from '@pages/prise-depose/emplacement-scan/emplacement-scan-routing.module';
import {ManutentionMenuPageRoutingModule} from '@pages/manutention/manutention-menu/manutention-menu-routing.module';
import {ManutentionValidatePageRoutingModule} from '@pages/manutention/manutention-validate/manutention-validate-routing.module';
import {PreparationMenuPageRoutingModule} from '@pages/stock/preparation/preparation-menu/preparation-menu-routing.module';
import {LivraisonMenuPageRoutingModule} from '@pages/stock/livraison/livraison-menu/livraison-menu-routing.module';
import {CollecteMenuPageRoutingModule} from '@pages/stock/collecte/collecte-menu/collecte-menu-routing.module';
import {InventoryLocationsPageRoutingModule} from '@pages/stock/inventory/inventory-locations/inventory-locations-routing.module';


@Component({
    selector: 'wii-main-header',
    templateUrl: 'main-header.component.html',
    styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit, OnDestroy {

    public static readonly MAX_PSEUDO_LENGTH: number = 35;

    @Output()
    public withHeader: EventEmitter<boolean>;

    @Output()
    public heightChange: EventEmitter<number>;

    @ViewChild('content', {read: ElementRef, static: false})
    public content: ElementRef;

    public loggedUser: string;

    public currentTitles: Array<TitleConfig>;
    public pageStack: Array<TitleConfig>;
    public titlesConfig: Array<TitleConfig>;
    public subTitle$: Observable<string>;

    public readonly iconMenuHide: Array<string> = [
        MainMenuPageRoutingModule.PATH,
        ParamsPageRoutingModule.PATH
    ];

    public readonly iconLogoutShow: Array<string> = [
        MainMenuPageRoutingModule.PATH
    ];

    public readonly iconLeftHide: Array<string> = [];

    public readonly userHide: Array<string> = [
        ParamsPageRoutingModule.PATH
    ];

    public readonly headerHide: Array<string> = [
        LoginPageRoutingModule.PATH
    ];

    public currentPagePath: string;
    public loading: boolean;
    public readonly isShown: {
        iconLogout?: boolean;
        iconLeft?: boolean;
        user?: boolean;
        menu?: boolean;
        header?: boolean;
    } = {};

    public routeStartChangeSubscription: Subscription;
    public routeEndChangeSubscription: Subscription;
    public popSubscription: Subscription;
    public logoutSubscription: Subscription;

    private pagesInStack: number;
    private readonly lastDirections: {
        [idNavigation: number]: {
            value: RouterDirection;
            origin: string;
        }
    };
    private lastRouteNavigated: string;

    public constructor(private storageService: StorageService,
                       private sqliteService: SqliteService,
                       private navController: NavController,
                       private navService: NavService,
                       private mainHeaderService: MainHeaderService,
                       private activatedRoute: ActivatedRoute,
                       private router: Router) {
        this.pagesInStack = 0;
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
        this.currentTitles = [];
        this.pageStack = [];
        this.subTitle$ = this.mainHeaderService.subTitle$;
        this.lastDirections = {};

        this.titlesConfig = [
            {pagePath: MainMenuPageRoutingModule.PATH, label: 'Menu'},
            {
                pagePath: PriseDeposeMenuPageRoutingModule.PATH,
                label: 'Traçabilité',
                filter: (params) => (
                    (typeof params.get('fromStock') === 'boolean') &&
                    !params.get('fromStock')
                )
            },
            {
                pagePath: PriseDeposeMenuPageRoutingModule.PATH,
                label: 'Transfert',
                filter: (params) => (
                    (typeof params.get('fromStock') === 'boolean') &&
                    params.get('fromStock')
                )
            },
            {
                pagePath: EmplacementScanPageRoutingModule.PATH,
                label: 'Prise',
                filter: (params) => (
                    (typeof params.get('fromDepose') === 'boolean') &&
                    !params.get('fromDepose')
                )
            },
            {
                pagePath: EmplacementScanPageRoutingModule.PATH,
                label: 'Dépose',
                filter: (params) => (
                    (typeof params.get('fromDepose') === 'boolean') &&
                    params.get('fromDepose')
                )
            },
            {pagePath: PreparationMenuPageRoutingModule.PATH, label: 'Préparation'},
            {pagePath: LivraisonMenuPageRoutingModule.PATH, label: 'Livraison'},
            {pagePath: CollecteMenuPageRoutingModule.PATH, label: 'Collecte'},
            {
                pagePath: InventoryLocationsPageRoutingModule.PATH,
                label: 'Inventaire',
                filter: (params) => !params.get('anomalyMode')
            },
            {
                pagePath: InventoryLocationsPageRoutingModule.PATH,
                label: 'Anomalies',
                filter: (params) => params.get('anomalyMode')
            },
            {pagePath: ManutentionMenuPageRoutingModule.PATH, label: 'Demande'},
            {pagePath: ManutentionValidatePageRoutingModule.name, label: 'Détails'}
        ];
    }

    public ngOnInit(): void {
        this.clearSubTitle();

        this.routeStartChangeSubscription = this.router.events
            .pipe(filter((event) => (event instanceof NavigationStart)))
            .subscribe((navigation: NavigationStart) => {
                const {id} = navigation;
                this.clearSubTitle();
                if (id) {
                    const transition = this.navController.consumeTransition();
                    const direction = transition && transition.direction;
                    if (direction) {
                        this.lastDirections[id] = {
                            value: direction,
                            origin: this.lastRouteNavigated
                        };
                    }
                }
            });

        this.routeEndChangeSubscription = merge(
            of({url: this.router.url}),
            this.router.events.pipe(filter((event) => (event instanceof NavigationEnd)))
        )
            .pipe(
                flatMap((data) => this.refreshUser().pipe(map(() => data)))
            )
            .subscribe((navigation: { url: string } & NavigationEnd) => {
                const {url, id: navigationId} = navigation;
                const [path] = (url || '').split('?');
                const urlSplit = (path || '').split('/').filter(Boolean);
                if (urlSplit && urlSplit.length > 0) {
                    if (this.loading) {
                        this.loading = false;
                    }
                    this.currentPagePath = urlSplit[urlSplit.length - 1];
                    this.lastRouteNavigated = this.currentPagePath;

                    this.isShown.iconLogout = this.iconLogoutShow.indexOf(this.currentPagePath) > -1;
                    this.isShown.iconLeft = this.iconLeftHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.user = this.userHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.menu = this.iconMenuHide.indexOf(this.currentPagePath) === -1;
                    this.isShown.header = this.headerHide.indexOf(this.currentPagePath) === -1;

                    const {paramsId} = (this.activatedRoute.snapshot.queryParams || {paramsId: undefined});
                    console.log(this.currentPagePath, this.lastDirections[navigationId], paramsId)
                    this.refreshTitles(navigationId, this.currentPagePath, paramsId);
                    this.withHeader.emit(this.headerHide.indexOf(this.currentPagePath) === -1);
                }
            });
    }

    public ngOnDestroy(): void {
        if (this.routeStartChangeSubscription) {
            this.routeStartChangeSubscription.unsubscribe();
            this.routeStartChangeSubscription = undefined;
        }
        if (this.routeEndChangeSubscription) {
            this.routeEndChangeSubscription.unsubscribe();
            this.routeEndChangeSubscription = undefined;
        }
        if (this.logoutSubscription) {
            this.logoutSubscription.unsubscribe();
            this.logoutSubscription = undefined;
        }
        if (this.popSubscription && !this.popSubscription.closed) {
            this.popSubscription.unsubscribe();
            this.popSubscription = undefined;
        }
    }

    public goHome(): void {
        this.mainHeaderService.emitNavigationChange();
        this.navService.setRoot(MainMenuPageRoutingModule.PATH);
    }

    public onTitleClick(last: boolean, titleConfig: TitleConfig): void {
        if (!last && !this.popSubscription) {
            if (titleConfig && titleConfig.stackIndex) {
                const nbNavigateBack = (this.pagesInStack - titleConfig.stackIndex);
                if (nbNavigateBack > 0) {
                    this.popSubscription = this.runMultiplePop(nbNavigateBack).subscribe(() => {
                        if (this.popSubscription && !this.popSubscription.closed) {
                            this.popSubscription.unsubscribe();
                            this.popSubscription = undefined;
                        }
                    });
                }
            }
        }
    }

    public onLeftIconClick(): void {
        return this.isShown.iconLogout
            ?  this.doLogout()
            : this.doPop();
    }

    private doPop(): void {
        this.mainHeaderService.emitNavigationChange();
        this.navService.pop();
    }

    private doLogout(): void {
        this.logoutSubscription = zip(
            this.sqliteService.resetDataBase(),
            this.storageService.clearStorage()
        )
            .subscribe(() => {
                this.navService.setRoot(LoginPageRoutingModule.PATH, {autoConnect: false});
                this.mainHeaderService.emitNavigationChange();
            });
    }

    private runMultiplePop(popNumber: number): Observable<void> {
        return popNumber > 0
            ? this.navService.pop().pipe(flatMap(() => this.runMultiplePop(popNumber - 1)))
            : of(undefined);
    }

    private refreshTitles(navigationId: number, currentPagePath: string, paramsId: number): void {
        if (navigationId && this.lastDirections[navigationId]) {
            if (this.lastDirections[navigationId].value === 'back') {
                const currentPageIndex = this.findIndexInPageStack(currentPagePath, paramsId);
                if (currentPageIndex > -1) {
                    this.pagesInStack = this.pageStack[currentPageIndex].stackIndex;
                    this.pageStack = this.pageStack.slice(0, currentPageIndex + 1)
                    this.refreshCurrentTitles();
                }
                else {
                    this.pagesInStack--;
                }
            }
            else {
                if (this.lastDirections[navigationId].value === 'root') {
                    this.pagesInStack = 1;
                    this.pageStack = [];
                }
                else {
                    this.pagesInStack++;
                }
                this.findTitleAndPushConfig(currentPagePath, paramsId);
            }
            delete this.lastDirections[navigationId];
        }
        else {
            this.findTitleAndPushConfig(currentPagePath, paramsId);
        }
    }

    private refreshUser(): Observable<void> {
        return this.storageService
            .getOperateur()
            .pipe(
                take(1),
                map((user: string) => (user || '').substring(0, MainHeaderComponent.MAX_PSEUDO_LENGTH)),
                tap((user: string) => {
                    this.loggedUser = user;
                }),
                map(() => undefined)
            );
    }

    private clearSubTitle(): void {
        this.mainHeaderService.emitSubTitle('');
    }

    private findTitleAndPushConfig(currentPagePath: string, paramsId?: number): void {
        const indexInPageStack = this.findIndexInPageStack(currentPagePath, paramsId);
        if (indexInPageStack === -1) {
            let currentTitleConfig = this.findTitleConfig(currentPagePath, paramsId);
            if (!currentTitleConfig) {
                currentTitleConfig = { pagePath: currentPagePath };
            }
            this.pageStack.push({...currentTitleConfig, stackIndex: this.pagesInStack});
            this.refreshCurrentTitles();
        }
    }

    private findIndexInPageStack(pagePath: string, paramsId: number): number {
        const currentNavParams = this.navService.getParams(paramsId);
        return this.pageStack.findIndex(({pagePath: currentPagePath, filter}) => (
            (pagePath === currentPagePath)
            && (!filter || filter(currentNavParams))
        ));
    }

    private findTitleConfig(path: string, paramsId: number): TitleConfig {
        const currentNavParams = this.navService.getParams(paramsId);
        return this.titlesConfig.find(({pagePath, filter}) => (
            (pagePath === path)
            && (!filter || filter(currentNavParams))
        ));
    }

    private refreshCurrentTitles() {
        this.currentTitles = this.pageStack.filter(({label}) => Boolean(label));
    }
}
