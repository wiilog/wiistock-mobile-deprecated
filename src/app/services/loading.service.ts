import {from} from 'rxjs/observable/from';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Loading, LoadingController} from 'ionic-angular';
import {map} from 'rxjs/operators';


@Injectable()
export class LoadingService {

    private static readonly DEFAULT_MESSAGE: string = 'Chargement...';

    public constructor(public loadingController: LoadingController) {}

    public presentLoading(message?: string): Observable<Loading> {
        const loading = this.loadingController.create({
            content: message ? message : LoadingService.DEFAULT_MESSAGE
        });
        return from(loading.present()).pipe(map(() => loading));
    }
}
