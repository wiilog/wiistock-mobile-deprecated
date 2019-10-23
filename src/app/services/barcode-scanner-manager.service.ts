import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs";
import {BarcodeScanner} from "@ionic-native/barcode-scanner";


@Injectable()
export class BarcodeScannerManagerService {

    private _canGoBack = false;

    public constructor(private barcodeScanner: BarcodeScanner) {}

    public scan(): Observable<string> {
        const subject = new Subject<string>();

        this.barcodeScanner.scan().then(res => {
            if (res.cancelled) {
                this._canGoBack = false;
                setTimeout(() => {this._canGoBack = true}, 500);
            } else {
                this._canGoBack = true;
            }
            subject.next(res.text);
        });

        return subject;
    }

    public get canGoBack(): boolean {
        return this._canGoBack;
    }

}
