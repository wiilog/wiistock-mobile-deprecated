import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";


@Injectable()
export class MainHeaderService {
    private readonly _navigationChange$: Subject<any>;

    public constructor() {
        this._navigationChange$ = new Subject<any>();
    }

    public emitNavigationChange() {
        this._navigationChange$.next(undefined);
    }

    public get navigationChange$(): Observable<any> {
        return this._navigationChange$;
    }
}
