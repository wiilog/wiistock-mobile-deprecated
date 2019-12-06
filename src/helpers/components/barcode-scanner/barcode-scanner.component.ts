import {Component, EventEmitter, Output} from '@angular/core';
import {BarcodeScannerManagerService} from '@app/services/barcode-scanner-manager.service';


@Component({
    selector: 'barcode-scanner',
    templateUrl: 'barcode-scanner.component.html'
})
export class BarcodeScannerComponent {

    public input: string;

    @Output()
    public add: EventEmitter<[string, boolean]> = new EventEmitter();

    public constructor(private barcodeScannerManager: BarcodeScannerManagerService) {}

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
