import {ToastController, ToastOptions} from "ionic-angular";
import {from} from "rxjs/observable/from";
import {take} from "rxjs/operators";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";


@Injectable()
export class ToastService {

    private static readonly DEFAULT_DURATION: number = 2000;

    private static readonly TOAST_OPTIONS: ToastOptions = {
        position: 'center',
        cssClass: 'toast-error'
    };

    public constructor(private toastController: ToastController) {}

    /**
     * @return Returns an observable which is resolved when the Toast transition has completed.
     */
    public presentToast(message: string, duration: number = ToastService.DEFAULT_DURATION): Observable<any> {
        const toast = this.toastController.create({
            ...(ToastService.TOAST_OPTIONS),
            message,
            duration
        });
        return from(toast.present()).pipe(take(1));
    }
}
