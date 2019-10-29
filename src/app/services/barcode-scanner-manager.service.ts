import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";


@Injectable()
export class BarcodeScannerManagerService {

    private static readonly ZEBRA_VALUE_ATTRIBUTE: string = 'com.symbol.datawedge.data_string';

    private readonly _zebraScan$: Subject<string>;

    private _canGoBack = true;

    public constructor(private barcodeScanner: BarcodeScanner) {
        this._canGoBack = true;
        this._zebraScan$ = new Subject<string>();

        (<any>window).plugins.intentShim.registerBroadcastReceiver({
                filterActions: ['io.ionic.starter.ACTION'],
                filterCategories: ['android.intent.category.DEFAULT']
            },
            (intent) => {
                this._zebraScan$.next(intent.extras[BarcodeScannerManagerService.ZEBRA_VALUE_ATTRIBUTE]);
            });
    }

    /**
     * @return {Observable<string>} An observable fired when the zebra scanner is used
     *                              The param is the string barcode
     */
    public get zebraScan$(): Observable<string> {
        return this._zebraScan$;
    }

    public scan(): Observable<string> {
        const subject = new Subject<string>();

        this.barcodeScanner.scan().then(res => {
            if (res.cancelled) {
                this._canGoBack = false;
                setTimeout(() => {this._canGoBack = true}, 500);
            } else {
                this._canGoBack = true;
                subject.next(res.text);
            }
        });

        return subject;
    }

    public get canGoBack(): boolean {
        return this._canGoBack;
    }

}
