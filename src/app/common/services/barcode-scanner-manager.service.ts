import {Injectable, NgZone} from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import {Observable, Subject} from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class BarcodeScannerManagerService {

    private static readonly ZEBRA_VALUE_ATTRIBUTE: string = 'com.symbol.datawedge.data_string';

    private readonly _zebraScan$: Subject<string>;

    private ngZone: NgZone;

    private zebraBroadcastReceiverAlreadyReceived: boolean;

    public constructor(private barcodeScanner: BarcodeScanner) {
        this._zebraScan$ = new Subject<string>();

        this.ngZone = new NgZone({enableLongStackTrace : false});
        this.zebraBroadcastReceiverAlreadyReceived = false;
    }

    public registerZebraBroadcastReceiver(): void {
        if (!this.zebraBroadcastReceiverAlreadyReceived) {
            this.zebraBroadcastReceiverAlreadyReceived = true;
            (<any>window).plugins.intentShim.registerBroadcastReceiver({
                    filterActions: ['io.ionic.starter.ACTION'],
                    filterCategories: ['android.intent.category.DEFAULT']
                },
                (intent) => {
                    this.ngZone.run(() => {
                        this._zebraScan$.next(intent.extras[BarcodeScannerManagerService.ZEBRA_VALUE_ATTRIBUTE]);
                    });
                });
        }
    }

    /**
     * @return An observable fired when the zebra scanner is used. The param is the string barcode.
     */
    public get zebraScan$(): Observable<string> {
        return this._zebraScan$;
    }

    public scan(): Observable<string> {
        const subject = new Subject<string>();

        this.barcodeScanner.scan().then(res => {
            if (!res.cancelled) {
                subject.next(res.text);
            }
            subject.complete();
        });

        return subject;
    }

}
