import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {BarcodeScannerManagerService} from "@app/services/barcode-scanner-manager.service";
import {Subscription} from "rxjs";


@Component({
    selector: 'barcode-scanner',
    templateUrl: 'barcode-scanner.component.html'
})
export class BarcodeScannerComponent implements OnInit, OnDestroy {

    public input: string;

    @Output()
    public add: EventEmitter<[string, boolean]> = new EventEmitter();

    public zebraScanSubscription: Subscription;

    public constructor(private barcodeScannerManager: BarcodeScannerManagerService) {}

    public ngOnInit(): void {
        this.zebraScanSubscription = this.barcodeScannerManager.zebraScan$.subscribe((barcode: string) => {
            this.add.emit([barcode, false]);
        });
    }

    public ngOnDestroy(): void {
        if (this.zebraScanSubscription) {
            this.zebraScanSubscription.unsubscribe();
            this.zebraScanSubscription = undefined;
        }
    }

    public scan(): void {
        this.barcodeScannerManager.scan().subscribe((barcode) => {
            this.add.emit([barcode, false]);
        });
    }

    public addManually() {
        if (this.input) {
            this.add.emit([this.input, true]);
            this.clear()
        }
    }

    public get isScanning(): boolean {
        return !this.barcodeScannerManager.canGoBack;
    }

    private clear(): void {
        this.input = '';
    }
}
