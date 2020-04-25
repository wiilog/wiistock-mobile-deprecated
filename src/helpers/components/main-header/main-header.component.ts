import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import {Nav, ViewController} from 'ionic-angular';
import {StorageService} from '@app/services/storage.service';
import {Observable, Subscription} from 'rxjs';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {ConnectPage} from '@pages/connect/connect';
import {ParamsPage} from '@pages/params/params';
import {filter, flatMap, map, take, tap} from 'rxjs/operators';
import {MainHeaderService} from '@app/services/main-header.service';
import {of} from 'rxjs/observable/of';
import {TitleConfig} from '@helpers/components/main-header/title-config';
import {PriseDeposeMenuPage} from '@pages/prise-depose/prise-depose-menu/prise-depose-menu';
import {EmplacementScanPage} from '@pages/prise-depose/emplacement-scan/emplacement-scan';
import {PreparationMenuPage} from '@pages/stock/preparation/preparation-menu/preparation-menu';
import {LivraisonMenuPage} from '@pages/stock/livraison/livraison-menu/livraison-menu';
import {CollecteMenuPage} from '@pages/stock/collecte/collecte-menu/collecte-menu';
import {ManutentionMenuPage} from '@pages/manutention/manutention-menu/manutention-menu';
import {ManutentionValidatePage} from '@pages/manutention/manutention-validate/manutention-validate';
import {InventoryLocationsPage} from '@pages/stock/inventory/inventory-locations/inventory-locations';


@Component({
    selector: 'wii-main-header',
    templateUrl: 'main-header.component.html'
})
export class MainHeaderComponent implements OnInit, OnDestroy {

    public static readonly MAX_PSEUDO_LENGTH: number = 35;

    @Input()
    public nav: Nav;

    @Output()
    public withHeader: EventEmitter<boolean>;

    @Output()
    public heightChange: EventEmitter<number>;

    @ViewChild('content', {read: ElementRef})
    public content: ElementRef;

    public loggedUser: string;

    public currentTitles: Array<TitleConfig>;
    public titlesConfig: Array<TitleConfig>;
    public subTitle$: Observable<string>;

    public readonly iconMenuHide: Array<string> = [
        MainMenuPage.name,
        ParamsPage.name
    ];

    public readonly iconLogoutShow: Array<string> = [
        MainMenuPage.name
    ];

    public readonly iconLeftHide: Array<string> = [];

    public readonly userHide: Array<string> = [
        ParamsPage.name
    ];

    public readonly headerHide: Array<string> = [
        ConnectPage.name
    ];

    public currentPageName: string;
    public loading: boolean;

    private viewDidEnterSubscription: Subscription;
    private viewWillLeaveSubscription: Subscription;

    public constructor(private storageService: StorageService,
                       private mainHeaderService: MainHeaderService,
                       private changeDetector: ChangeDetectorRef) {
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
        this.currentTitles = [];
        this.subTitle$ = this.mainHeaderService.subTitle$.pipe(tap(() => {
            this.notifyHeightChange();
        }));

        this.titlesConfig = [
            {pageName: MainMenuPage.name, label: 'Menu'},
            {
                pageName: PriseDeposeMenuPage.name,
                label: 'Traçabilité',
                filter: (instance) => (
                    (typeof instance.fromStock === 'boolean') &&
                    !instance.fromStock
                )
            },
            {
                pageName: PriseDeposeMenuPage.name,
                label: 'Transfert',
                filter: (instance) => (
                    (typeof instance.fromStock === 'boolean') &&
                    instance.fromStock
                )
            },
            {
                pageName: EmplacementScanPage.name,
                label: 'Prise',
                filter: (instance) => (
                    (typeof instance.fromDepose === 'boolean') &&
                    !instance.fromDepose
                )
            },
            {
                pageName: EmplacementScanPage.name,
                label: 'Dépose',
                filter: (instance) => (
                    (typeof instance.fromDepose === 'boolean') &&
                    instance.fromDepose
                )
            },
            {pageName: PreparationMenuPage.name, label: 'Préparation'},
            {pageName: LivraisonMenuPage.name, label: 'Livraison'},
            {pageName: CollecteMenuPage.name, label: 'Collecte'},
            {pageName: InventoryLocationsPage.name, label: 'Inventaire'},
            {pageName: ManutentionMenuPage.name, label: 'Demande'},
            {pageName: ManutentionValidatePage.name, label: 'Détails'}
        ];
    }

    public ngOnInit(): void {
        this.clearSubTitle();

        this.viewWillLeaveSubscription = this.nav.viewWillLeave.subscribe(() => {
            this.clearSubTitle();
        });

        this.viewDidEnterSubscription = Observable
            .merge(
                of(this.nav.getActive()).pipe(filter(Boolean)),
                this.nav.viewDidEnter
            )
            .pipe(
                flatMap((data) => this.refreshUser().pipe(map(() => data)))
            )
            .subscribe((data) => {
                this.onPageChange(data);
                this.notifyHeightChange();
            });
    }

    public ngOnDestroy(): void {
        if (this.viewDidEnterSubscription) {
            this.viewDidEnterSubscription.unsubscribe();
            this.viewDidEnterSubscription = undefined;
        }
        if (this.viewWillLeaveSubscription) {
            this.viewWillLeaveSubscription.unsubscribe();
            this.viewWillLeaveSubscription = undefined;
        }
    }

    public goHome(): void {
        this.mainHeaderService.emitNavigationChange();
        this.nav.setRoot(MainMenuPage);
    }

    public doPop(): void {
        this.mainHeaderService.emitNavigationChange();
        this.nav.pop();
    }

    public doLogout(): void {
        this.mainHeaderService.emitNavigationChange();
        this.nav.setRoot(ConnectPage);
    }

    public onImageLoad() {
        this.notifyHeightChange();
    }

    public onTitleClick(view: ViewController): void {
        if (view) {
            this.nav.popTo(view);
        }
    }

    /**
     * Return blockSize without px
     */
    private get height(): number {
        const resRegex = this.content
            ? (/(\d+(?:\.\d+)?).*/.exec((window.getComputedStyle(this.content.nativeElement) as any).blockSize) || [])
            : [];
        return resRegex.length > 1 ? resRegex[1] : 0;
    }

    private onPageChange(data: any): void {
        this.loading = false;
        this.currentPageName = data.component.name;
        this.refreshTitles();
        this.withHeader.emit(this.headerHide.indexOf(this.currentPageName) === -1);
    }

    private refreshTitles(): void {
        const viewsLength = this.nav.getViews().length;
        this.currentTitles = this.nav
            .getViews()
            .reduce((acc: Array<TitleConfig>, view: ViewController, index: number) => {
                const titleConfig = this.findTitleConfig(view.name, view.instance);

                if (titleConfig) {
                    acc.push({
                        ...titleConfig,
                        view,
                        // when it's not the last view displayed we can click on it
                        enableClick: ((viewsLength - 1) !== index)
                    });
                }
                return acc;
            }, []);
    }

    private refreshUser(): Observable<undefined> {
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

    private notifyHeightChange(): void {
        this.changeDetector.detectChanges();
        this.heightChange.emit(this.height);
    }

    private findTitleConfig(name: string, instance: any): TitleConfig {
        return this.titlesConfig.find(({pageName, filter}) => (
            (pageName === name) &&
            (
                !filter ||
                (instance && filter(instance))
            )
        ));
    }
}
