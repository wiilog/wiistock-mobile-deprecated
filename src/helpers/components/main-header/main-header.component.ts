import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Nav} from 'ionic-angular';
import {StorageService} from '@app/services/storage.service';
import {Observable, Subscription} from 'rxjs';
import {MenuPage} from '@pages/menu/menu';
import {ConnectPage} from '@pages/connect/connect';
import {ParamsPage} from '@pages/params/params';
import {flatMap, map, take, tap} from 'rxjs/operators';


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

    @ViewChild('content')
    public content: ElementRef;

    public loggedUser: string;

    public readonly iconMenuHide: Array<string> = [
        MenuPage.name,
        ParamsPage.name
    ];

    public readonly iconPopHide: Array<string> = [
        MenuPage.name
    ];

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
                       private changeDetector: ChangeDetectorRef,
                       private elementRef: ElementRef) {
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
    }

    public ngOnInit(): void {
        this.refreshUser().subscribe(() => {
            this.notifyHeightChange();
        });

        this.viewDidEnterSubscription = this.nav
            .viewDidEnter
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
        this.nav.setRoot(MenuPage);
    }

    public doPop(): void {
        this.nav.pop();
    }

    private get height(): number {
        return this.elementRef.nativeElement.getBoundingClientRect().height;
    }

    private onPageChange(data: any): void {
        this.loading = false;
        this.currentPageName = data.component.name;
        this.withHeader.emit(this.headerHide.indexOf(this.currentPageName) === -1);
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
        setTimeout(() => {
            this.heightChange.emit(this.height);
        });
    }
}
