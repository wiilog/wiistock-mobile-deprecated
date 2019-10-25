import {ToastController, ToastOptions} from "ionic-angular";
import {from} from "rxjs/observable/from";
import {take} from "rxjs/operators";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";


@Injectable()
export class ToastService {

    private static readonly TOAST_OPTIONS: ToastOptions = {
        duration: 2000,
        position: 'center',
        cssClass: 'toast-error'
    };

    public constructor(private toastController: ToastController) {}

    /**
     * @param {string} message
     * @return {Observable<*>} Returns an observable which is resolved when the Toast transition has completed.
     */
    public showToast(message: string): Observable<any> {
        const toast = this.toastController.create({message, ...(ToastService.TOAST_OPTIONS)});
        return from(toast.present()).pipe(take(1));
    }
}
