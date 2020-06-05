import {ActivatedRoute, Params as RouteParams} from '@angular/router';
import {Injectable} from '@angular/core';
import {NavController} from '@ionic/angular';
import {from, Observable} from 'rxjs';


type Params = Map<string, any>;

@Injectable({
    providedIn: 'root'
})
export class NavService {

    private static ParamsCounter: number = 0;

    private static readonly ParamsCollection: {[paramId: number]: Params} = {};

    public constructor(private navController: NavController,
                       private activatedRoute: ActivatedRoute) {
    }

    private static GetUniqueParamsId(): number {
        return ++NavService.ParamsCounter;
    }

    private static SetParams(paramId: number, params: Params): void {
        if (params) {
            NavService.ParamsCollection[paramId] = params;
        }
    }

    public push(path: string, params?: RouteParams): Observable<boolean> {
        const paramsId = this.treatParams(params);
        const navigationExtras = this.createNavigationOption(paramsId);
        return from(this.navController.navigateForward(path, navigationExtras));
    }

    public setRoot(routeName: string, params?: RouteParams): Observable<boolean> {
        const paramsId = this.treatParams(params);
        const navigationExtras = this.createNavigationOption(paramsId);
        return from(this.navController.navigateRoot(routeName, navigationExtras));
    }

    public pop(): Observable<void> {
        return from(this.navController.pop());
    }

    public treatParams(params?: RouteParams): number {
        let uniqueParamsId;
        if (params
            && (Object.keys(params).length > 0)) {
            const mapParams = new Map<string, any>(Object.entries(params));
            uniqueParamsId = NavService.GetUniqueParamsId();
            NavService.SetParams(uniqueParamsId, mapParams);
        }
        return uniqueParamsId;
    }

    public createNavigationOption(paramsId?: number): { queryParams?: RouteParams } {
        return paramsId
            ? {queryParams: {paramsId}}
            : {};
    }

    public getParams(paramId: number): Params {
        return NavService.ParamsCollection[paramId] || new Map<string, any>();
    }

    public removeParams(paramId: number): void {
        if (NavService.ParamsCollection[paramId]) {
            delete NavService.ParamsCollection[paramId];
        }
    }

    public getCurrentParams(): Params {
        const paramsId = this.activatedRoute.snapshot.queryParams.paramsId;
        return this.getParams(paramsId);
    }
}
