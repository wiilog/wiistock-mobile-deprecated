import {NavService, Params} from '@app/common/services/nav/nav.service';
import {OnDestroy, OnInit} from '@angular/core';
import {ViewWillEnter} from '@ionic/angular';


export abstract class PageComponent implements ViewWillEnter, OnInit, OnDestroy {

    private _paramId: number;

    protected constructor(protected navService: NavService) {}

    public ngOnInit(): void {
        this._paramId = this.navService.getCurrentParamId();
    }

    public ionViewWillEnter(): void {
        this._paramId = this.navService.getCurrentParamId();
    }

    public ngOnDestroy(): void {
        this.navService.removeParams(this.currentNavParamId);
    }

    public get currentNavParamId(): number {
        return this._paramId;
    }

    public get currentNavParams(): Params {
        return this.navService.getParams(this.currentNavParamId);
    }
}
