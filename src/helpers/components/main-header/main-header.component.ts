import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Type,
    ViewChild
} from '@angular/core';
import {Nav} from 'ionic-angular';
import {StorageService} from '@app/services/storage.service';
import {Observable, Subscription} from 'rxjs';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {ConnectPage} from '@pages/connect/connect';
import {ParamsPage} from '@pages/params/params';
import {filter, flatMap, map, take, tap} from 'rxjs/operators';
import {MainHeaderService} from '@app/services/main-header.service';
import {of} from 'rxjs/observable/of';
import {TitleConfig} from '@helpers/components/main-header/title-config';


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

    public currentTitles: Array<TitleConfig<any>>;

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

    public constructor(private storageService: StorageService,
                       private mainHeaderService: MainHeaderService,
                       private changeDetector: ChangeDetectorRef) {
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
        this.currentTitles = [];
    }

    public ngOnInit(): void {
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

    public onTitleClick(page: Type<any>): void {
        const viewTo = this.nav
            .getViews()
            .reverse()
            .find(({name}) => (page.name === name));

        if (viewTo) {
            this.nav.popTo(viewTo);
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
        this.refreshTitles(this.currentPageName, data.instance);
        this.withHeader.emit(this.headerHide.indexOf(this.currentPageName) === -1);
    }

    private refreshTitles(name: string, instance: any): void {
        const configsToDisplay = this.mainHeaderService.matchTitleConfig(name, instance);
        const configToDisplay = (configsToDisplay.length > 0) ? configsToDisplay[0] : undefined;
        console.log(name, ' + ', instance, ' ---> ', configToDisplay);
        if (configToDisplay) {
            const currentIndex = this.mainHeaderService.findIndexTitleConfig(configToDisplay, this.currentTitles);
            // if title already shown then we remove all titles after
            if (currentIndex > -1) {
                // if it's the last we do nothing
                if (currentIndex < (this.currentTitles.length - 1)) {
                    const startIndexToRemove = (currentIndex + 1);
                    const nbTiTlesToRemove = (this.currentTitles.length - (currentIndex + 1));
                    this.currentTitles.splice(startIndexToRemove, nbTiTlesToRemove);

                    console.log('ON PASSE ICI 1');
                }

                console.log('ON PASSE ICI 2');
            }
            // if not title not shown
            else {
                this.currentTitles.push(configToDisplay);
                console.log('ON PASSE ICI 3');
            }
            this.changeDetector.detectChanges();
        }
        console.log('RES --> ', this.currentTitles)
    }

    private refreshUser(): Observable<undefined> {
        return this.storageService
            .getOperateur()
            .pipe(
                take(1),
                map((user: string) => user.substring(0, MainHeaderComponent.MAX_PSEUDO_LENGTH)),
                tap((user: string) => {
                    this.loggedUser = user;
                }),
                map(() => undefined)
            );
    }

    private notifyHeightChange(): void {
        this.changeDetector.detectChanges();
        this.heightChange.emit(this.height);
    }
}
