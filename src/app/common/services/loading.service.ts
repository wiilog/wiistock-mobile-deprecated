import {Injectable} from '@angular/core';
import {from, Observable, of} from 'rxjs';
import {LoadingController} from '@ionic/angular';
import {flatMap, map} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class LoadingService {

    private static readonly DEFAULT_MESSAGE: string = 'Chargement...';

    public constructor(public loadingController: LoadingController) {}

    public presentLoading(message?: string): Observable<HTMLIonLoadingElement> {
        const messageToPrint = message ? message : LoadingService.DEFAULT_MESSAGE;
        return of(undefined)
            .pipe(
                flatMap(() => from(this.loadingController.create({message: messageToPrint}))),
                flatMap((loading) => from(loading.present()).pipe(map(() => loading)))
            )
    }
}
