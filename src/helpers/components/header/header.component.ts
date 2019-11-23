import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {Nav} from 'ionic-angular';
import {StorageService} from '@app/services/storage.service';
import {Observable, Subscription} from 'rxjs';
import {MenuPage} from '@pages/menu/menu';
import {ConnectPage} from '@pages/connect/connect';
import {ParamsPage} from "@pages/params/params";


@Component({
    selector: 'wii-header',
    templateUrl: 'header.component.html'
})
export class HeaderComponent implements AfterViewInit, OnDestroy {

    @Input()
    public nav: Nav;

    @Output()
    public withHeader: EventEmitter<boolean>;

    @ViewChild('content')
    public content: ElementRef;

    public loggedUser: Observable<string>;

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

    public constructor(storageService: StorageService) {
        this.loggedUser = storageService.getOperateur();
        this.loading = true;
        this.withHeader = new EventEmitter<boolean>();
    }

    public ngAfterViewInit(): void {
        this.viewDidEnterSubscription = this.nav.viewDidEnter.subscribe((data) => {
            this.loading = false;
            this.currentPageName = data.component.name;
            this.withHeader.emit(this.headerHide.indexOf(this.currentPageName) === -1);
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
}
