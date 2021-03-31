import {Injectable} from '@angular/core';
import {from, Observable, of, throwError} from 'rxjs';
import {LoadingController} from '@ionic/angular';
import {catchError, flatMap, map, tap} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    private static readonly DEFAULT_MESSAGE: string = 'Chargement...';

    private lastLoading?: HTMLIonLoadingElement;

    public constructor(public loadingController: LoadingController) {}

    public presentLoading(message?: string): Observable<HTMLIonLoadingElement> {
        const messageToPrint = message ? message : LoadingService.DEFAULT_MESSAGE;
        return of(undefined)
            .pipe(
                flatMap(() => from(this.loadingController.create({message: messageToPrint}))),
                flatMap((loading) => from(loading.present()).pipe(map(() => loading))),
                tap((loading: HTMLIonLoadingElement) => {
                    this.lastLoading = loading;
                })
            );
    }

    public presentLoadingWhile<T>({message, event}: { message?: string; event: () => Observable<T>; }): Observable<T> {
        return this.presentLoading(message)
            .pipe(
                flatMap((loader) => event().pipe(
                    map((res) => ([res, loader])),
                    catchError((err) => from(loader.dismiss()).pipe(flatMap(() => throwError(err))))
                )),
                flatMap(([res, loader]: [T, HTMLIonLoadingElement]) => from(loader.dismiss()).pipe(map(() => res))),
            );
    }

    public dismissLastLoading(): Observable<void> {
        return (this.lastLoading
            ? from(this.lastLoading.dismiss()).pipe(
                catchError(() => of(undefined)),
                map(() => undefined)
            )
            : of(undefined))
    }
}
