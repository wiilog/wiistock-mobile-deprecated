import {ActivatedRoute, Params as RouteParams} from '@angular/router';
import {Injectable} from '@angular/core';
import {NavController} from '@ionic/angular';
import {from, Observable} from 'rxjs';
import {environment} from '@environments/environment';
import {tap} from 'rxjs/operators';
import {MainHeaderService} from '@app/common/services/main-header.service';
import {NavPathEnum} from '@app/common/services/nav/nav-path.enum';


export type Params = Map<string, any>;

@Injectable({
    providedIn: 'root'
})
export class NavService {

    private static ParamsCounter: number = 0;

    private static readonly ParamsCollection: {[paramId: number]: Params} = {};

    public constructor(private navController: NavController,
                       private mainHeaderService: MainHeaderService,
                       private activatedRoute: ActivatedRoute) {
        if (!environment.production && window) {
            (window as any).NAV_PARAMS = NavService.ParamsCollection;
        }
    }

    private static GetUniqueParamsId(): number {
        return ++NavService.ParamsCounter;
    }

    private static SetParams(paramId: number, params: Params): void {
        if (params) {
            NavService.ParamsCollection[paramId] = params;
        }
    }

    public push(routeName: NavPathEnum, params?: RouteParams): Observable<boolean> {
        const paramsId = this.treatParams(params);
        const navigationExtras = this.createNavigationOption(paramsId);
        return from(this.navController.navigateForward(routeName, navigationExtras));
    }

    public setRoot(routeName: NavPathEnum, params?: RouteParams): Observable<boolean> {
        this.clearParams();

        const paramsId = this.treatParams(params);
        const navigationExtras = this.createNavigationOption(paramsId);
        return from(this.navController.navigateRoot(routeName, {
            replaceUrl: true,
            ...navigationExtras
        }));
    }

    public pop(): Observable<void> {
        return from(this.navController.pop()).pipe(tap(() => this.mainHeaderService.emitSubTitle('')));
    }

    public treatParams(params?: RouteParams): number {
        let uniqueParamsId;
        if (params
            && (Object.keys(params).length > 0)) {
            uniqueParamsId = NavService.GetUniqueParamsId();
            const mapParams = new Map<string, any>(Object.entries(params));
            NavService.SetParams(uniqueParamsId, mapParams);
        }
        return uniqueParamsId;
    }

    public createNavigationOption(paramsId?: number): { queryParams?: RouteParams, onSameUrlNavigation?: 'reload' } {
        return paramsId
            ? {queryParams: {paramsId}, onSameUrlNavigation: 'reload'}
            : {};
    }

    public getParams(paramId: number): Params {
        return NavService.ParamsCollection[paramId] || new Map<string, any>();
    }

    public getCurrentParamId(): number {
        return this.activatedRoute.snapshot.queryParams.paramsId;
    }

    public removeParams(paramId: number): void {
        if (NavService.ParamsCollection[paramId]) {
            delete NavService.ParamsCollection[paramId];
        }
    }

    private clearParams(): void {
        Object.keys(NavService.ParamsCollection)
            .forEach((key) => {
                this.removeParams(Number(key));
            });
    }
}
