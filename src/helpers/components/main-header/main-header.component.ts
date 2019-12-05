import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {Nav} from 'ionic-angular';
import {StorageService} from '@app/services/storage.service';
import {Subscription} from 'rxjs';
import {MainMenuPage} from '@pages/main-menu/main-menu';
import {ConnectPage} from '@pages/connect/connect';
import {ParamsPage} from "@pages/params/params";


@Component({
    selector: 'wii-main-header',
    templateUrl: 'main-header.component.html'
})
export class MainHeaderComponent implements OnInit, OnDestroy {

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
        MainMenuPage.name,
        ParamsPage.name
    ];

    public readonly iconPopHide: Array<string> = [
        MainMenuPage.name
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
    private operatorSubscription: Subscription;

    public constructor(private storageService: StorageService,
                       private changeDetector: ChangeDetectorRef,
                       private elementRef: ElementRef) {
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
        this.heightChange = new EventEmitter<number>();
    }

    public ngOnInit(): void {
        this.operatorSubscription = this.storageService.getOperateur().subscribe((user) => {
            this.loggedUser = user;
            this.changeDetector.detectChanges();
            setTimeout(() => {
                this.heightChange.emit(this.height);
            });
        });

        this.viewDidEnterSubscription = this.nav.viewDidEnter.subscribe((data) => {
            this.loading = false;
            this.currentPageName = data.component.name;
            this.withHeader.emit(this.headerHide.indexOf(this.currentPageName) === -1);
            this.changeDetector.detectChanges();
            setTimeout(() => {
                this.heightChange.emit(this.height);
            });
        });
    }

    public ngOnDestroy(): void {
        if (this.viewDidEnterSubscription) {
            this.viewDidEnterSubscription.unsubscribe();
            this.viewDidEnterSubscription = undefined;
        }
        if (this.operatorSubscription) {
            this.operatorSubscription.unsubscribe();
            this.operatorSubscription = undefined;
        }
    }

    public goHome(): void {
        this.nav.setRoot(MainMenuPage);
    }

    public doPop(): void {
        this.nav.pop();
    }

    private get height(): number {
        return this.elementRef.nativeElement.getBoundingClientRect().height;
    }
}
