import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";


@Injectable()
export class ZebraBarcodeScannerService {

    private static readonly ZEBRA_VALUE_ATTRIBUTE: string = 'com.symbol.datawedge.data_string';

    private readonly _zebraScan$: Subject<string>;

    public constructor() {
        this._zebraScan$ = new Subject<string>();

        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: ['io.ionic.starter.ACTION'],
                filterCategories: ['android.intent.category.DEFAULT']
            },
            (intent) => {
                this._zebraScan$.next(intent.extras[ZebraBarcodeScannerService.ZEBRA_VALUE_ATTRIBUTE]);
            });
    }

    /**
     * @return {Observable<string>} An observable fired when the zebra scanner is used
     *                              The param is the string barcode
     */
    public get zebraScan$(): Observable<string> {
        return this._zebraScan$;
    }
}
